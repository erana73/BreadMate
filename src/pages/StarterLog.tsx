import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Starter, Feeding } from '../models'
import { db } from '../db/database'
import { FLOUR_TYPES } from '../lib/recipeEngine'

// ─── helpers ─────────────────────────────────────────────────────────────────

function getNextDue(starter: Starter): Date {
  const sorted = [...starter.feedings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  const lastFedAt = sorted.length ? new Date(sorted[0].timestamp) : new Date(starter.createdAt)
  return new Date(lastFedAt.getTime() + starter.feedingIntervalHours * 3_600_000)
}

type StatusLabel = 'Healthy' | 'Due Soon' | 'Overdue'

function getStatus(starter: Starter): { label: StatusLabel; classes: string } {
  const msUntil = getNextDue(starter).getTime() - Date.now()
  if (msUntil < 0)               return { label: 'Overdue',  classes: 'bg-red-100 text-red-700 border border-red-200' }
  if (msUntil < 2 * 3_600_000)   return { label: 'Due Soon', classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200' }
  return                                  { label: 'Healthy',  classes: 'bg-green-100 text-green-700 border border-green-200' }
}

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const mins  = Math.floor(abs / 60_000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  const past  = diffMs < 0
  if (days > 0)  return past ? `${days}d ago`  : `in ${days}d`
  if (hours > 0) return past ? `${hours}h ago` : `in ${hours}h`
  if (mins > 0)  return past ? `${mins}m ago`  : `in ${mins}m`
  return 'just now'
}

function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ starter }: { starter: Starter }) {
  const { label, classes } = getStatus(starter)
  const nextDue = getNextDue(starter)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${classes}`}>{label}</span>
      <span className="text-xs text-gray-400">
        {label === 'Overdue'
          ? `due ${formatRelative(nextDue)}`
          : `next feeding ${formatRelative(nextDue)}`}
      </span>
    </div>
  )
}

// ─── Add Starter Form ─────────────────────────────────────────────────────────

interface AddStarterFormProps {
  onSave: (starter: Starter) => void
  onCancel: () => void
}

function AddStarterForm({ onSave, onCancel }: AddStarterFormProps) {
  const [name, setName] = useState('')
  const [flourType, setFlourType] = useState('bread-flour')
  const [intervalHours, setIntervalHours] = useState(24)
  const [ratioFlour, setRatioFlour] = useState(1)
  const [ratioWater, setRatioWater] = useState(1)
  const [ratioStarter, setRatioStarter] = useState(1)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const starter: Starter = {
      id: uuidv4(),
      name: name.trim(),
      flourType,
      createdAt: new Date(),
      feedingIntervalHours: intervalHours,
      defaultRatio: { flour: ratioFlour, water: ratioWater, starter: ratioStarter },
      feedings: [],
    }
    onSave(starter)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-amber-200 shadow-md p-5 space-y-4"
    >
      <h2 className="text-lg font-bold text-amber-900">New Starter</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. My Levain"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Flour Type</label>
          <select
            value={flourType}
            onChange={e => setFlourType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            {FLOUR_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Feeding Interval</label>
          <select
            value={intervalHours}
            onChange={e => setIntervalHours(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value={8}>Every 8 hours</option>
            <option value={12}>Every 12 hours</option>
            <option value={24}>Every 24 hours</option>
            <option value={48}>Every 48 hours</option>
            <option value={72}>Every 72 hours</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Ratio (starter : flour : water)
        </label>
        <div className="flex items-center gap-2">
          {[
            { label: 'Starter', value: ratioStarter, set: setRatioStarter },
            { label: 'Flour',   value: ratioFlour,   set: setRatioFlour },
            { label: 'Water',   value: ratioWater,   set: setRatioWater },
          ].map(({ label, value, set }, i) => (
            <span key={label} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-400">:</span>}
              <input
                type="number"
                min={1}
                value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs text-gray-400">{label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl text-sm"
        >
          Add Starter
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Log Feeding Form ─────────────────────────────────────────────────────────

interface FeedingFormProps {
  starter: Starter
  onSave: (feeding: Feeding) => void
  onCancel: () => void
}

function FeedingForm({ starter, onSave, onCancel }: FeedingFormProps) {
  const ratio = starter.defaultRatio
  const baseGrams = 20
  const [flourAmount, setFlourAmount]       = useState(baseGrams * ratio.flour)
  const [waterAmount, setWaterAmount]       = useState(baseGrams * ratio.water)
  const [starterRetained, setStarterRetained] = useState(baseGrams * ratio.starter)
  const [notes, setNotes]                   = useState('')
  const [timestamp, setTimestamp]           = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      flourAmount,
      waterAmount,
      starterRetained,
      notes: notes.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-amber-100">
      <h3 className="text-sm font-semibold text-amber-900">Log Feeding</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Starter retained (g)', value: starterRetained, set: setStarterRetained },
          { label: 'Flour (g)',            value: flourAmount,     set: setFlourAmount },
          { label: 'Water (g)',            value: waterAmount,     set: setWaterAmount },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input
              type="number"
              min={0}
              value={value}
              onChange={e => set(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Time</label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={e => setTimestamp(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. smells tangy, doubled in 6h"
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl text-sm"
        >
          Save Feeding
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Feeding History ──────────────────────────────────────────────────────────

function FeedingHistory({ feedings, onDelete }: { feedings: Feeding[]; onDelete: (id: string) => void }) {
  const sorted = [...feedings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400 py-2">No feedings logged yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
            <th className="pb-1.5 font-medium">Date</th>
            <th className="pb-1.5 font-medium">Starter (g)</th>
            <th className="pb-1.5 font-medium">Flour (g)</th>
            <th className="pb-1.5 font-medium">Water (g)</th>
            <th className="pb-1.5 font-medium">Notes</th>
            <th className="pb-1.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map(f => (
            <tr key={f.id} className="text-gray-700">
              <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(f.timestamp)}</td>
              <td className="py-2 pr-3">{f.starterRetained}</td>
              <td className="py-2 pr-3">{f.flourAmount}</td>
              <td className="py-2 pr-3">{f.waterAmount}</td>
              <td className="py-2 pr-3 text-gray-400 text-xs max-w-[160px] truncate">{f.notes || '—'}</td>
              <td className="py-2">
                <button
                  onClick={() => onDelete(f.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Starter Card ─────────────────────────────────────────────────────────────

interface StarterCardProps {
  starter: Starter
  onChange: (updated: Starter) => void
  onDelete: (id: string) => void
}

function StarterCard({ starter, onChange, onDelete }: StarterCardProps) {
  const [expanded, setExpanded]       = useState(false)
  const [showFeedForm, setShowFeedForm] = useState(false)
  const [showHistory, setShowHistory]  = useState(false)
  const [editInterval, setEditInterval] = useState(false)
  const [newInterval, setNewInterval]   = useState(starter.feedingIntervalHours)

  const { label: statusLabel, classes: statusClasses } = getStatus(starter)
  const nextDue = getNextDue(starter)
  const lastFeeding = [...starter.feedings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0]

  function feedNow() {
    const ratio = starter.defaultRatio
    const baseGrams = 20
    const feeding: Feeding = {
      id: uuidv4(),
      timestamp: new Date(),
      starterRetained: baseGrams * ratio.starter,
      flourAmount: baseGrams * ratio.flour,
      waterAmount: baseGrams * ratio.water,
      notes: 'Quick feed',
    }
    const updated = { ...starter, feedings: [...starter.feedings, feeding] }
    onChange(updated)
  }

  function logFeeding(feeding: Feeding) {
    const updated = { ...starter, feedings: [...starter.feedings, feeding] }
    onChange(updated)
    setShowFeedForm(false)
  }

  function deleteFeeding(feedingId: string) {
    const updated = { ...starter, feedings: starter.feedings.filter(f => f.id !== feedingId) }
    onChange(updated)
  }

  function saveInterval() {
    onChange({ ...starter, feedingIntervalHours: newInterval })
    setEditInterval(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-md overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-amber-900 text-lg">{starter.name}</h2>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusClasses}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {starter.flourType.replace(/-/g, ' ')} · every {starter.feedingIntervalHours}h ·{' '}
            {lastFeeding
              ? `last fed ${formatRelative(new Date(lastFeeding.timestamp))}`
              : 'never fed'}
          </p>
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-amber-100 px-5 pb-5 pt-4 space-y-4">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge starter={starter} />
            <span className="text-xs text-gray-400">
              Next due: {formatDateTime(nextDue)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={feedNow}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl"
            >
              Fed Now
            </button>
            <button
              onClick={() => { setShowFeedForm(f => !f); setShowHistory(false) }}
              className="px-4 py-2 bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 text-sm font-semibold rounded-xl"
            >
              Log Feeding
            </button>
            <button
              onClick={() => { setShowHistory(h => !h); setShowFeedForm(false) }}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl"
            >
              History ({starter.feedings.length})
            </button>
            <button
              onClick={() => setEditInterval(e => !e)}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl"
            >
              Schedule
            </button>
            <button
              onClick={() => onDelete(starter.id)}
              className="ml-auto px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl"
            >
              Delete
            </button>
          </div>

          {/* Feeding form */}
          {showFeedForm && (
            <FeedingForm
              starter={starter}
              onSave={logFeeding}
              onCancel={() => setShowFeedForm(false)}
            />
          )}

          {/* History */}
          {showHistory && (
            <div className="pt-3 border-t border-amber-100">
              <h3 className="text-sm font-semibold text-amber-900 mb-3">Feeding History</h3>
              <FeedingHistory feedings={starter.feedings} onDelete={deleteFeeding} />
            </div>
          )}

          {/* Feeding interval editor */}
          {editInterval && (
            <div className="pt-3 border-t border-amber-100 space-y-2">
              <h3 className="text-sm font-semibold text-amber-900">Feeding Schedule</h3>
              <div className="flex items-center gap-2">
                <select
                  value={newInterval}
                  onChange={e => setNewInterval(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={8}>Every 8 hours</option>
                  <option value={12}>Every 12 hours</option>
                  <option value={24}>Every 24 hours</option>
                  <option value={48}>Every 48 hours</option>
                  <option value={72}>Every 72 hours</option>
                </select>
                <button
                  onClick={saveInterval}
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditInterval(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function StarterLog() {
  const [starters, setStarters] = useState<Starter[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // Load from DB
  useEffect(() => {
    db.starters.toArray().then(rows => {
      setStarters(rows)
      setLoading(false)
    })
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Schedule / fire feeding notifications
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const handles: ReturnType<typeof setTimeout>[] = []

    starters.forEach(starter => {
      const nextDue = getNextDue(starter)
      const msUntil = nextDue.getTime() - Date.now()

      if (msUntil <= 0) {
        new Notification(`${starter.name} needs feeding!`, {
          body: 'Your sourdough starter is overdue for feeding.',
        })
      } else if (msUntil < 24 * 3_600_000) {
        handles.push(setTimeout(() => {
          new Notification(`${starter.name} needs feeding!`, {
            body: 'Time to feed your sourdough starter.',
          })
        }, msUntil))
      }
    })

    return () => handles.forEach(h => clearTimeout(h))
  }, [starters])

  // Persist changes
  async function updateStarter(updated: Starter) {
    await db.starters.put(updated)
    setStarters(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  async function addStarter(starter: Starter) {
    await db.starters.put(starter)
    setStarters(prev => [...prev, starter])
    setShowAddForm(false)
  }

  async function deleteStarter(id: string) {
    await db.starters.delete(id)
    setStarters(prev => prev.filter(s => s.id !== id))
  }

  if (loading) {
    return <div className="py-20 text-center text-amber-700">Loading…</div>
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Starter Log</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage your sourdough starters.</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="shrink-0 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl text-sm"
          >
            + New Starter
          </button>
        )}
      </div>

      {/* Add starter form */}
      {showAddForm && (
        <AddStarterForm onSave={addStarter} onCancel={() => setShowAddForm(false)} />
      )}

      {/* Starter list */}
      {starters.length === 0 && !showAddForm ? (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-md p-10 text-center">
          <div className="text-4xl mb-3">🫙</div>
          <p className="text-gray-500 mb-4">No starters yet. Add one to begin tracking.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl"
          >
            Add Your First Starter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {starters.map(starter => (
            <StarterCard
              key={starter.id}
              starter={starter}
              onChange={updateStarter}
              onDelete={deleteStarter}
            />
          ))}
        </div>
      )}
    </div>
  )
}
