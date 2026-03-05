import { v4 as uuidv4 } from 'uuid'
import type { Recipe, Ingredient, Step } from '../models'
import { findBaseRecipe } from '../data/baseRecipes'

export interface RecipeParams {
  breadType: string
  flourType: string
  kneadingMethod: string
  leavening: Recipe['leavening']
  complexity: Recipe['complexity']
}

// Hydration adjustments by flour type (relative to bread-flour baseline)
const FLOUR_HYDRATION_DELTA: Record<string, number> = {
  'bread-flour': 0,
  'all-purpose': -3,
  'whole-wheat': 5,
  'spelt': 5,
  'whole-spelt': 8,
  'rye': 10,
  'whole-rye': 15,
  'einkorn': -5,
  'gluten-free': 10,
}

// Fermentation time multipliers by leavening
const LEAVENING_TIME_MULT: Record<string, number> = {
  'active-dry-yeast': 1.0,
  'instant-yeast': 0.8,
  'sourdough': 2.0,
  'hybrid': 1.5,
}

// Leavening ingredient names to swap in
const LEAVENING_INGREDIENTS: Record<string, Ingredient[]> = {
  'active-dry-yeast': [{ name: 'Active dry yeast', amount: 7, unit: 'g' }],
  'instant-yeast': [{ name: 'Instant yeast', amount: 5, unit: 'g' }],
  'sourdough': [
    { name: 'Refrigerated starter (seed for levain)', amount: 20, unit: 'g' },
    { name: 'Active levain (100% hydration, see Step 1)', amount: 100, unit: 'g' },
  ],
  'hybrid': [
    { name: 'Refrigerated starter (seed for levain)', amount: 20, unit: 'g' },
    { name: 'Active levain (100% hydration, see Step 1)', amount: 50, unit: 'g' },
    { name: 'Instant yeast', amount: 2, unit: 'g' },
  ],
}

// Sourdough prep steps prepended before main recipe steps
const SOURDOUGH_PREP_STEPS: Step[] = [
  {
    order: 1,
    title: 'Feed your starter (levain build)',
    instruction:
      'Take 20 g of your refrigerated starter and combine with 40 g bread flour + 40 g water (1:2:2 ratio). ' +
      'Stir well, cover loosely, and leave at room temperature (70–75°F / 21–24°C) for 8–12 hours. ' +
      'The levain is ready when it has more than doubled, looks domed and bubbly on top, and smells pleasantly tangy and yeasty. ' +
      'You will use 100 g of this levain in your dough (discard or save the rest).',
    duration: 480,
    isTimerStep: true,
    timerLabel: 'Levain build (8–12 h)',
  },
  {
    order: 2,
    title: 'Check levain readiness',
    instruction:
      'Before mixing your dough, confirm the levain is active: it should have at least doubled in volume, ' +
      'the surface should be domed and covered in bubbles, and a small spoonful dropped into water should float. ' +
      'If it is not ready, wait another 1–2 hours and check again.',
    duration: null,
    isTimerStep: false,
    timerLabel: '',
  },
]

const HYBRID_PREP_STEPS: Step[] = [
  {
    order: 1,
    title: 'Feed your starter (levain build)',
    instruction:
      'Take 20 g of your refrigerated starter and combine with 20 g bread flour + 20 g water (1:1:1 ratio). ' +
      'Stir well, cover loosely, and leave at room temperature for 4–6 hours. ' +
      'The levain does not need to fully peak — it mainly adds flavour; the instant yeast will do most of the leavening. ' +
      'You will use 50 g of this levain in the recipe.',
    duration: 240,
    isTimerStep: true,
    timerLabel: 'Levain build (4–6 h)',
  },
]

// Human-readable flour names for ingredients
const FLOUR_DISPLAY_NAME: Record<string, string> = {
  'bread-flour': 'Bread flour',
  'all-purpose': 'All-purpose flour',
  'whole-wheat': 'Whole wheat flour',
  'spelt': 'Spelt flour',
  'whole-spelt': 'Whole spelt flour',
  'rye': 'Rye flour',
  'whole-rye': 'Whole rye flour',
  'einkorn': 'Einkorn flour',
  'gluten-free': 'Gluten-free flour blend',
}

// Kneading method instruction overrides
const KNEADING_STEP_OVERRIDE: Record<string, string> = {
  'hand-knead': 'Knead by hand on a lightly floured surface until the dough is smooth and passes the windowpane test, about 10–12 minutes.',
  'stand-mixer': 'Knead with a dough hook in a stand mixer on medium speed until smooth and elastic, about 6–8 minutes.',
  'stretch-and-fold': 'Instead of kneading, perform stretch-and-fold sets: every 30 minutes for 2 hours, grab one side of the dough, stretch it up, and fold it over. Repeat on all four sides.',
  'no-knead': 'No kneading required. Simply stir until all flour is hydrated, then let time do the work.',
}

// Complexity-based step filtering
const COMPLEXITY_MAX_STEPS: Record<string, number> = {
  beginner: 5,
  intermediate: 100,
  advanced: 100,
}

function applyKneadingOverride(steps: Step[], method: string): Step[] {
  const override = KNEADING_STEP_OVERRIDE[method]
  if (!override) return steps
  return steps.map(step =>
    step.title.toLowerCase().includes('knead') || step.title.toLowerCase().includes('stretch')
      ? { ...step, instruction: override }
      : step
  )
}

function scaleTimerSteps(steps: Step[], multiplier: number): Step[] {
  return steps.map(step =>
    step.isTimerStep && step.duration !== null
      ? { ...step, duration: Math.round(step.duration * multiplier) }
      : step
  )
}

export function buildRecipe(params: RecipeParams): Recipe | null {
  const base = findBaseRecipe(params.breadType)
  if (!base) return null

  const hydrationDelta = FLOUR_HYDRATION_DELTA[params.flourType] ?? 0
  const hydration = base.hydration + hydrationDelta

  const timeMult = LEAVENING_TIME_MULT[params.leavening] ?? 1.0

  // Build ingredient list: replace yeast/starter with correct leavening
  const leavenIngredients = LEAVENING_INGREDIENTS[params.leavening] ?? []
  const nonLeaven = base.ingredients.filter(
    i => !i.name.toLowerCase().includes('yeast') && !i.name.toLowerCase().includes('starter')
  )

  // Consolidate all flour ingredients into one with the selected flour type
  const flourIngredients = nonLeaven.filter(i => i.name.toLowerCase().includes('flour'))
  const totalFlourWeight = flourIngredients.reduce((sum, i) => sum + i.amount, 0)
  const flourName = FLOUR_DISPLAY_NAME[params.flourType] ?? 'Flour'
  const consolidatedFlour: Ingredient = { name: flourName, amount: totalFlourWeight, unit: 'g' }

  const nonFlourNonLeaven = nonLeaven.filter(i => !i.name.toLowerCase().includes('flour'))
  const ingredients: Ingredient[] = [consolidatedFlour, ...nonFlourNonLeaven, ...leavenIngredients]

  // Adjust water for hydration delta based on total flour weight
  const adjustedWater = Math.round((totalFlourWeight * hydration) / 100)
  const finalIngredients = ingredients.map(i =>
    i.name.toLowerCase().includes('water') ? { ...i, amount: adjustedWater } : i
  )

  // Build steps
  let steps = [...base.steps]
  steps = applyKneadingOverride(steps, params.kneadingMethod)
  steps = scaleTimerSteps(steps, timeMult)

  // Prepend sourdough starter prep steps and renumber
  if (params.leavening === 'sourdough') {
    steps = [...SOURDOUGH_PREP_STEPS, ...steps].map((s, i) => ({ ...s, order: i + 1 }))
  } else if (params.leavening === 'hybrid') {
    steps = [...HYBRID_PREP_STEPS, ...steps].map((s, i) => ({ ...s, order: i + 1 }))
  }

  // Trim steps for beginner complexity
  const maxSteps = COMPLEXITY_MAX_STEPS[params.complexity] ?? 100
  steps = steps.slice(0, maxSteps)

  const totalTime = steps.reduce((sum, s) => sum + (s.duration ?? 0), 0)

  const flourLabel = params.flourType.replace(/-/g, ' ')
  const breadLabel = params.breadType.replace(/-/g, ' ')

  return {
    id: uuidv4(),
    name: `${flourLabel.charAt(0).toUpperCase() + flourLabel.slice(1)} ${base.name}`,
    source: 'built-in',
    flourType: params.flourType,
    breadType: params.breadType,
    kneadingMethod: params.kneadingMethod,
    leavening: params.leavening,
    complexity: params.complexity,
    hydration,
    ingredients: finalIngredients,
    steps,
    totalTime,
    createdAt: new Date(),
  }
}

export const BREAD_TYPES = [
  { value: 'sandwich-loaf', label: 'Sandwich Loaf' },
  { value: 'artisan-boule', label: 'Artisan Boule' },
  { value: 'focaccia', label: 'Focaccia' },
  { value: 'pizza-dough', label: 'Pizza Dough' },
  { value: 'bagels', label: 'Bagels' },
]

export const FLOUR_TYPES = [
  { value: 'bread-flour', label: 'Bread Flour' },
  { value: 'all-purpose', label: 'All-Purpose Flour' },
  { value: 'whole-wheat', label: 'Whole Wheat' },
  { value: 'spelt', label: 'Spelt' },
  { value: 'whole-spelt', label: 'Whole Spelt' },
  { value: 'rye', label: 'Rye' },
  { value: 'whole-rye', label: 'Whole Rye' },
  { value: 'einkorn', label: 'Einkorn' },
  { value: 'gluten-free', label: 'Gluten-Free Blend' },
]

export const KNEADING_METHODS = [
  { value: 'hand-knead', label: 'Traditional Hand Knead' },
  { value: 'stand-mixer', label: 'Stand Mixer' },
  { value: 'stretch-and-fold', label: 'Stretch & Fold' },
  { value: 'no-knead', label: 'No-Knead' },
]

export const LEAVENING_TYPES = [
  { value: 'active-dry-yeast', label: 'Active Dry Yeast' },
  { value: 'instant-yeast', label: 'Instant Yeast' },
  { value: 'sourdough', label: 'Sourdough Starter' },
  { value: 'hybrid', label: 'Hybrid (Sourdough + Yeast)' },
]

export const COMPLEXITY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]
