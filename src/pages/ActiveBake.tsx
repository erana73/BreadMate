import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import type { Recipe } from '../models'
import { db } from '../db/database'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
    osc.start()
    osc.stop(ctx.currentTime + 1.5)
  } catch {
    // AudioContext unavailable — silent
  }
}

function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}

// ─── types ───────────────────────────────────────────────────────────────────

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'snoozed'

interface Timer {
  remaining: number // seconds
  status: TimerStatus
}

interface BakeState {
  sessionId: string
  currentStep: number
  mode: 'guided' | 'overview'
  timers: Timer[]
  bakeStatus: 'active' | 'completed'
}

function initTimers(recipe: Recipe): Timer[] {
  return recipe.steps.map(s => ({
    remaining: s.isTimerStep && s.duration ? s.duration * 60 : 0,
    status: 'idle' as TimerStatus,
  }))
}

// ─── main component ──────────────────────────────────────────────────────────

export default function ActiveBake() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const recipeId = searchParams.get('recipeId')

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [state, setState] = useState<BakeState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable refs so interval callbacks access fresh values without re-registering
  const recipeRef = useRef<Recipe | null>(null)
  const stateRef = useRef<BakeState | null>(null)
  useEffect(() => { stateRef.current = state }, [state])

  // ── init: load recipe + restore/create session ────────────────────────────
  useEffect(() => {
    if (!recipeId) {
      setError('No recipe selected. Go to My Recipes and click "Start Bake".')
      setLoading(false)
      return
    }

    async function init() {
      const r = await db.recipes.get(recipeId!)
      if (!r) {
        setError('Recipe not found. Make sure it is saved first.')
        setLoading(false)
        return
      }
      recipeRef.current = r
      setRecipe(r)

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }

      const existing = await db.bakeSessions
        .where('recipeId').equals(recipeId!)
        .and(s => s.status === 'active')
        .first()

      if (existing) {
        setState({
          sessionId: existing.id,
          currentStep: existing.currentStep,
          mode: existing.mode,
          timers: existing.timerStates.map(t => ({ remaining: t.remaining, status: t.status })),
          bakeStatus: 'active',
        })
      } else {
        setState({
          sessionId: uuidv4(),
          currentStep: 0,
          mode: 'guided',
          timers: initTimers(r),
          bakeStatus: 'active',
        })
      }
      setLoading(false)
    }

    init()
  }, [recipeId])

  // ── auto-start timer when arriving at a step in guided mode ───────────────
  // Uses setState(prev=>) so we only need currentStep/mode as deps, not full state.
  useEffect(() => {
    if (!recipe) return
    setState(prev => {
      if (!prev || prev.mode !== 'guided' || prev.bakeStatus === 'completed') return prev
      const i = prev.currentStep
      const step = recipe.steps[i]
      if (!step?.isTimerStep) return prev
      if (prev.timers[i]?.status !== 'idle') return prev
      const timers = [...prev.timers]
      timers[i] = { ...timers[i], status: 'running' }
      return { ...prev, timers }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.currentStep, state?.mode, recipe])

  // ── timer tick (1 s interval) ─────────────────────────────────────────────
  useEffect(() => {
    if (!recipe) return
    const interval = setInterval(() => {
      setState(prev => {
        if (!prev || prev.bakeStatus === 'completed') return prev
        const justCompleted: number[] = []
        const timers = prev.timers.map((t, i) => {
          if (t.status !== 'running') return t
          if (t.remaining <= 1) {
            justCompleted.push(i)
            return { ...t, remaining: 0, status: 'completed' as TimerStatus }
          }
          return { ...t, remaining: t.remaining - 1 }
        })
        if (justCompleted.length) {
          // Fire audio + notification outside setState
          setTimeout(() => {
            justCompleted.forEach(i => {
              playBeep()
              const step = recipeRef.current?.steps[i]
              if (step) sendNotification(step.timerLabel || step.title, `Step ${i + 1} timer complete!`)
            })
          }, 0)
        }
        return { ...prev, timers }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [recipe]) // stable — only fires once recipe is loaded

  // ── persist to DB every 5 s via stable interval ───────────────────────────
  useEffect(() => {
    if (!recipe) return
    const interval = setInterval(() => {
      const s = stateRef.current
      if (!s) return
      db.bakeSessions.put({
        id: s.sessionId,
        recipeId: recipe.id,
        startedAt: new Date(),
        currentStep: s.currentStep,
        mode: s.mode,
        timerStates: s.timers.map((t, i) => ({ stepIndex: i, remaining: t.remaining, status: t.status })),
        status: s.bakeStatus,
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [recipe])

  // ── actions ───────────────────────────────────────────────────────────────

  function toggleMode() {
    setState(prev => prev ? { ...prev, mode: prev.mode === 'guided' ? 'overview' : 'guided' } : prev)
  }

  function nextStep() {
    if (!recipe || !state) return
    if (state.currentStep >= recipe.steps.length - 1) {
      completeBake()
    } else {
      setState(prev => prev ? { ...prev, currentStep: prev.currentStep + 1 } : prev)
    }
  }

  function goToStep(i: number) {
    setState(prev => prev ? { ...prev, currentStep: i } : prev)
  }

  function completeBake() {
    setState(prev => {
      if (!prev) return prev
      const next = { ...prev, bakeStatus: 'completed' as const }
      // Persist immediately
      setTimeout(() => {
        const r = recipeRef.current
        if (!r) return
        db.bakeSessions.put({
          id: next.sessionId,
          recipeId: r.id,
          startedAt: new Date(),
          currentStep: next.currentStep,
          mode: next.mode,
          timerStates: next.timers.map((t, i) => ({ stepIndex: i, remaining: t.remaining, status: t.status })),
          status: 'completed',
        })
      }, 0)
      return next
    })
  }

  function timerAction(i: number, action: 'start' | 'pause' | 'reset' | 'snooze') {
    setState(prev => {
      if (!prev) return prev
      const step = recipeRef.current?.steps[i]
      const timers = [...prev.timers]
      switch (action) {
        case 'start':  timers[i] = { ...timers[i], status: 'running' }; break
        case 'pause':  timers[i] = { ...timers[i], status: 'paused' }; break
        case 'reset':  timers[i] = { remaining: step?.duration ? step.duration * 60 : 0, status: 'idle' }; break
        case 'snooze': timers[i] = { remaining: 5 * 60, status: 'running' }; break
      }
      return { ...prev, timers }
    })
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="py-20 text-center text-amber-700">Loading bake session…</div>
  }

  if (error || !recipe || !state) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-amber-900">Active Bake</h1>
        <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error ?? 'Something went wrong.'}
        </p>
        <button
          onClick={() => navigate('/my-recipes')}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-sm font-semibold"
        >
          Go to My Recipes
        </button>
      </div>
    )
  }

  if (state.bakeStatus === 'completed') {
    return (
      <div className="text-center py-16 space-y-5">
        <div className="text-6xl">🍞</div>
        <h2 className="text-3xl font-bold text-amber-900">Bake Complete!</h2>
        <p className="text-gray-600">Enjoy your {recipe.name}!</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/my-recipes')}
            className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl"
          >
            My Recipes
          </button>
          <button
            onClick={() => navigate('/new-bake')}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
          >
            New Bake
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.round((state.currentStep / recipe.steps.length) * 100)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">{recipe.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Step {state.currentStep + 1} of {recipe.steps.length}
          </p>
        </div>
        <button
          onClick={toggleMode}
          className="shrink-0 px-3 py-1.5 text-sm font-semibold rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
        >
          {state.mode === 'guided' ? 'Switch to Overview' : 'Switch to Guided'}
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-2">
          <div
            className="bg-amber-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {state.mode === 'guided' ? (
        <GuidedMode
          recipe={recipe}
          state={state}
          onNext={nextStep}
          onTimerAction={timerAction}
        />
      ) : (
        <OverviewMode
          recipe={recipe}
          state={state}
          onStepClick={goToStep}
          onTimerAction={timerAction}
          onFinish={completeBake}
        />
      )}
    </div>
  )
}

// ─── TimerControls ────────────────────────────────────────────────────────────

function TimerControls({
  timer,
  onAction,
}: {
  timer: Timer
  onAction: (a: 'start' | 'pause' | 'reset' | 'snooze') => void
}) {
  const { status, remaining } = timer
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <span className={`text-5xl font-mono font-bold tabular-nums tracking-tight ${
        status === 'running'   ? 'text-amber-700' :
        status === 'completed' ? 'text-green-600' :
        status === 'paused'    ? 'text-yellow-600' :
        'text-gray-400'
      }`}>
        {formatCountdown(remaining)}
      </span>
      <div className="flex flex-wrap gap-2 justify-center">
        {status === 'idle' && (
          <button onClick={() => onAction('start')} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg">
            Start Timer
          </button>
        )}
        {status === 'running' && (
          <button onClick={() => onAction('pause')} className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg">
            Pause
          </button>
        )}
        {status === 'paused' && (
          <button onClick={() => onAction('start')} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg">
            Resume
          </button>
        )}
        {status === 'completed' && (
          <button onClick={() => onAction('snooze')} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg">
            Snooze 5 min
          </button>
        )}
        {status !== 'idle' && (
          <button onClick={() => onAction('reset')} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg">
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

// ─── GuidedMode ───────────────────────────────────────────────────────────────

function GuidedMode({
  recipe,
  state,
  onNext,
  onTimerAction,
}: {
  recipe: Recipe
  state: BakeState
  onNext: () => void
  onTimerAction: (i: number, a: 'start' | 'pause' | 'reset' | 'snooze') => void
}) {
  const i = state.currentStep
  const step = recipe.steps[i]
  const timer = state.timers[i]
  const isLastStep = i === recipe.steps.length - 1
  const timerRunning = timer?.status === 'running'

  return (
    <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-6 space-y-4">
      {/* Step header */}
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-9 h-9 rounded-full bg-amber-700 text-white font-bold text-lg flex items-center justify-center">
          {step.order}
        </span>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
          {step.duration !== null && (
            <span className="inline-block mt-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
              ⏱ {formatTime(step.duration)}
            </span>
          )}
        </div>
      </div>

      {/* Instruction */}
      <p className="text-gray-700 leading-relaxed">{step.instruction}</p>

      {/* Timer */}
      {step.isTimerStep && timer && (
        <div className="border-t border-amber-100 pt-4">
          <TimerControls timer={timer} onAction={a => onTimerAction(i, a)} />
        </div>
      )}

      {timer?.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm text-center font-medium">
          ✓ Timer complete — ready for the next step!
        </div>
      )}

      {/* Next / Finish button */}
      <div className="pt-1">
        <button
          onClick={onNext}
          className={`w-full py-3 font-semibold rounded-xl transition-colors ${
            timerRunning
              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm'
              : 'bg-amber-700 hover:bg-amber-800 text-white'
          }`}
        >
          {isLastStep
            ? '🍞 Finish Bake'
            : timerRunning
            ? 'Skip — Next Step →'
            : 'Next Step →'}
        </button>
      </div>
    </div>
  )
}

// ─── OverviewMode ─────────────────────────────────────────────────────────────

function OverviewMode({
  recipe,
  state,
  onStepClick,
  onTimerAction,
  onFinish,
}: {
  recipe: Recipe
  state: BakeState
  onStepClick: (i: number) => void
  onTimerAction: (i: number, a: 'start' | 'pause' | 'reset' | 'snooze') => void
  onFinish: () => void
}) {
  return (
    <div className="space-y-3">
      {recipe.steps.map((step, i) => {
        const isActive = i === state.currentStep
        const isPast = i < state.currentStep
        const timer = state.timers[i]

        return (
          <div
            key={step.order}
            className={`rounded-2xl border transition-colors ${
              isActive ? 'border-amber-400 bg-amber-50 shadow-md' :
              isPast   ? 'border-gray-200 bg-gray-50 opacity-60' :
                         'border-gray-200 bg-white'
            }`}
          >
            {/* Step row — clickable to jump */}
            <div
              className="flex items-start gap-3 p-4 cursor-pointer"
              onClick={() => onStepClick(i)}
            >
              <span className={`shrink-0 w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center ${
                isPast   ? 'bg-green-500 text-white' :
                isActive ? 'bg-amber-700 text-white' :
                           'bg-gray-200 text-gray-600'
              }`}>
                {isPast ? '✓' : step.order}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800">{step.title}</span>
                  {step.duration !== null && (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      ⏱ {formatTime(step.duration)}
                    </span>
                  )}
                  {timer && timer.status !== 'idle' && timer.status !== 'completed' && (
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      timer.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {formatCountdown(timer.remaining)}
                    </span>
                  )}
                  {timer?.status === 'completed' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Done</span>
                  )}
                </div>
                {isActive && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{step.instruction}</p>
                )}
              </div>
            </div>

            {/* Timer controls for active step */}
            {isActive && step.isTimerStep && timer && (
              <div className="border-t border-amber-200 px-4 pb-4">
                <TimerControls timer={timer} onAction={a => onTimerAction(i, a)} />
              </div>
            )}
          </div>
        )
      })}

      <button
        onClick={onFinish}
        className="w-full py-3 mt-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl"
      >
        🍞 Finish Bake
      </button>
    </div>
  )
}
