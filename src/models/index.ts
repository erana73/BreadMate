export type Unit = 'g' | 'ml' | 'tsp' | 'tbsp' | 'cup' | 'piece'

export interface Ingredient {
  name: string
  amount: number
  unit: Unit
}

export interface Step {
  order: number
  title: string
  instruction: string
  duration: number | null // minutes; null = no timer
  isTimerStep: boolean
  timerLabel: string
}

export interface Recipe {
  id: string
  name: string
  source: 'built-in' | 'custom' | 'ai-generated'
  flourType: string
  breadType: string
  kneadingMethod: string
  leavening: 'active-dry-yeast' | 'instant-yeast' | 'sourdough' | 'hybrid'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  hydration: number // percentage
  ingredients: Ingredient[]
  steps: Step[]
  totalTime: number // minutes
  createdAt: Date
}

export interface Feeding {
  id: string
  timestamp: Date
  flourAmount: number // grams
  waterAmount: number // grams
  starterRetained: number // grams
  notes: string
}

export interface Starter {
  id: string
  name: string
  flourType: string
  createdAt: Date
  feedingIntervalHours: number
  defaultRatio: { flour: number; water: number; starter: number }
  feedings: Feeding[]
}

export interface TimerState {
  stepIndex: number
  remaining: number // seconds
  status: 'idle' | 'running' | 'paused' | 'completed' | 'snoozed'
}

export interface BakeSession {
  id: string
  recipeId: string
  startedAt: Date
  currentStep: number
  mode: 'guided' | 'overview'
  timerStates: TimerState[]
  status: 'active' | 'paused' | 'completed'
}
