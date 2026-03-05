import type { Ingredient, Step } from '../models'

export interface BaseRecipe {
  breadType: string
  name: string
  hydration: number
  totalTime: number // minutes
  ingredients: Ingredient[]
  steps: Step[]
}

export const BASE_RECIPES: BaseRecipe[] = [
  {
    breadType: 'sandwich-loaf',
    name: 'Classic Sandwich Loaf',
    hydration: 65,
    totalTime: 210,
    ingredients: [
      { name: 'Bread flour', amount: 500, unit: 'g' },
      { name: 'Water (warm)', amount: 325, unit: 'ml' },
      { name: 'Salt', amount: 10, unit: 'g' },
      { name: 'Sugar', amount: 15, unit: 'g' },
      { name: 'Butter (softened)', amount: 20, unit: 'g' },
    ],
    steps: [
      { order: 1, title: 'Mix dough', instruction: 'Combine flour, water, salt, and sugar. Mix until shaggy dough forms.', duration: 10, isTimerStep: false, timerLabel: '' },
      { order: 2, title: 'Knead', instruction: 'Knead dough until smooth and elastic, about 10 minutes by hand.', duration: 10, isTimerStep: true, timerLabel: 'Kneading timer' },
      { order: 3, title: 'First rise', instruction: 'Cover and let rise in a warm place until doubled, about 1 hour.', duration: 60, isTimerStep: true, timerLabel: 'First rise' },
      { order: 4, title: 'Shape', instruction: 'Punch down dough, shape into a log, and place in a greased loaf pan.', duration: null, isTimerStep: false, timerLabel: '' },
      { order: 5, title: 'Second rise', instruction: 'Cover and let rise until dough crowns above the pan, about 45 minutes.', duration: 45, isTimerStep: true, timerLabel: 'Proof timer' },
      { order: 6, title: 'Bake', instruction: 'Bake at 375°F (190°C) until golden and hollow-sounding when tapped, about 35 minutes.', duration: 35, isTimerStep: true, timerLabel: 'Bake timer' },
      { order: 7, title: 'Cool', instruction: 'Cool on a wire rack for at least 20 minutes before slicing.', duration: 20, isTimerStep: true, timerLabel: 'Cooling timer' },
    ],
  },
  {
    breadType: 'artisan-boule',
    name: 'Artisan Boule',
    hydration: 72,
    totalTime: 300,
    ingredients: [
      { name: 'Bread flour', amount: 450, unit: 'g' },
      { name: 'Whole wheat flour', amount: 50, unit: 'g' },
      { name: 'Water (warm)', amount: 360, unit: 'ml' },
      { name: 'Salt', amount: 10, unit: 'g' },
    ],
    steps: [
      { order: 1, title: 'Autolyse', instruction: 'Mix flour and water until no dry flour remains. Rest for 30 minutes.', duration: 30, isTimerStep: true, timerLabel: 'Autolyse timer' },
      { order: 2, title: 'Add salt & mix', instruction: 'Add salt and mix thoroughly by squeezing dough through your fingers.', duration: 5, isTimerStep: false, timerLabel: '' },
      { order: 3, title: 'Stretch & fold', instruction: 'Perform 4 sets of stretch and fold, 30 minutes apart.', duration: 120, isTimerStep: true, timerLabel: 'Bulk fermentation' },
      { order: 4, title: 'Shape', instruction: 'Gently pre-shape into a round. Rest 20 minutes, then final shape into a tight boule.', duration: 20, isTimerStep: true, timerLabel: 'Bench rest' },
      { order: 5, title: 'Proof', instruction: 'Place in a floured banneton and refrigerate overnight (8–12 hours).', duration: null, isTimerStep: false, timerLabel: '' },
      { order: 6, title: 'Preheat & score', instruction: 'Preheat oven to 500°F (260°C) with Dutch oven inside for 45 minutes. Score loaf just before baking.', duration: 45, isTimerStep: true, timerLabel: 'Preheat timer' },
      { order: 7, title: 'Bake covered', instruction: 'Bake covered at 500°F for 20 minutes.', duration: 20, isTimerStep: true, timerLabel: 'Covered bake' },
      { order: 8, title: 'Bake uncovered', instruction: 'Remove lid, reduce to 450°F (230°C), and bake 20 more minutes until deep brown.', duration: 20, isTimerStep: true, timerLabel: 'Uncovered bake' },
      { order: 9, title: 'Cool', instruction: 'Cool on a wire rack for at least 1 hour before slicing.', duration: 60, isTimerStep: true, timerLabel: 'Cooling timer' },
    ],
  },
  {
    breadType: 'focaccia',
    name: 'Classic Focaccia',
    hydration: 80,
    totalTime: 180,
    ingredients: [
      { name: 'Bread flour', amount: 500, unit: 'g' },
      { name: 'Water (warm)', amount: 400, unit: 'ml' },
      { name: 'Salt', amount: 10, unit: 'g' },
      { name: 'Olive oil', amount: 60, unit: 'ml' },
      { name: 'Flaky sea salt (topping)', amount: 5, unit: 'g' },
      { name: 'Fresh rosemary', amount: 2, unit: 'tbsp' },
    ],
    steps: [
      { order: 1, title: 'Mix dough', instruction: 'Whisk water with olive oil, add flour and salt, and mix until combined.', duration: 10, isTimerStep: false, timerLabel: '' },
      { order: 2, title: 'First rise', instruction: 'Cover and let rise until doubled, about 1 hour.', duration: 60, isTimerStep: true, timerLabel: 'First rise' },
      { order: 3, title: 'Pan & dimple', instruction: 'Pour into an oiled pan. Dimple aggressively with fingers. Drizzle more olive oil.', duration: null, isTimerStep: false, timerLabel: '' },
      { order: 4, title: 'Second rise', instruction: 'Let rise until puffy, about 45 minutes.', duration: 45, isTimerStep: true, timerLabel: 'Second rise' },
      { order: 5, title: 'Bake', instruction: 'Top with rosemary and flaky salt. Bake at 425°F (220°C) for 25 minutes until golden.', duration: 25, isTimerStep: true, timerLabel: 'Bake timer' },
      { order: 6, title: 'Cool', instruction: 'Cool in pan for 10 minutes, then transfer to a rack.', duration: 10, isTimerStep: true, timerLabel: 'Cooling timer' },
    ],
  },
  {
    breadType: 'pizza-dough',
    name: 'Classic Pizza Dough',
    hydration: 62,
    totalTime: 90,
    ingredients: [
      { name: 'Bread flour', amount: 500, unit: 'g' },
      { name: 'Water (warm)', amount: 310, unit: 'ml' },
      { name: 'Salt', amount: 10, unit: 'g' },
      { name: 'Olive oil', amount: 15, unit: 'ml' },
      { name: 'Sugar', amount: 5, unit: 'g' },
    ],
    steps: [
      { order: 1, title: 'Mix dough', instruction: 'Combine all ingredients and mix until a smooth dough forms.', duration: 10, isTimerStep: false, timerLabel: '' },
      { order: 2, title: 'Knead', instruction: 'Knead until smooth and elastic, about 8 minutes.', duration: 8, isTimerStep: true, timerLabel: 'Kneading timer' },
      { order: 3, title: 'Rise', instruction: 'Cover and let rise until doubled, about 1 hour.', duration: 60, isTimerStep: true, timerLabel: 'Rise timer' },
      { order: 4, title: 'Divide & rest', instruction: 'Divide into 2–3 balls. Rest 15 minutes before shaping.', duration: 15, isTimerStep: true, timerLabel: 'Rest timer' },
      { order: 5, title: 'Shape & top', instruction: 'Stretch each ball into a round and add your toppings.', duration: null, isTimerStep: false, timerLabel: '' },
    ],
  },
  {
    breadType: 'bagels',
    name: 'Classic Bagels',
    hydration: 55,
    totalTime: 240,
    ingredients: [
      { name: 'Bread flour', amount: 500, unit: 'g' },
      { name: 'Water (warm)', amount: 275, unit: 'ml' },
      { name: 'Salt', amount: 10, unit: 'g' },
      { name: 'Sugar', amount: 15, unit: 'g' },
      { name: 'Baking soda (for boiling)', amount: 2, unit: 'tbsp' },
    ],
    steps: [
      { order: 1, title: 'Mix & knead', instruction: 'Combine all ingredients and knead until a stiff, smooth dough forms, about 12 minutes.', duration: 12, isTimerStep: true, timerLabel: 'Kneading timer' },
      { order: 2, title: 'Rest', instruction: 'Divide into 8 pieces and shape into balls. Rest 30 minutes.', duration: 30, isTimerStep: true, timerLabel: 'Rest timer' },
      { order: 3, title: 'Shape', instruction: 'Poke a hole in the center and stretch to form a ring. Rings should be 3–4 inches across.', duration: null, isTimerStep: false, timerLabel: '' },
      { order: 4, title: 'Cold retard', instruction: 'Place on a lined tray, cover, and refrigerate overnight.', duration: null, isTimerStep: false, timerLabel: '' },
      { order: 5, title: 'Boil', instruction: 'Boil in water with baking soda, 1–2 minutes per side. Add toppings while wet.', duration: null, isTimerStep: false, timerLabel: '' },
      { order: 6, title: 'Bake', instruction: 'Bake at 425°F (220°C) for 20–25 minutes until deep golden.', duration: 25, isTimerStep: true, timerLabel: 'Bake timer' },
    ],
  },
]

export function findBaseRecipe(breadType: string): BaseRecipe | undefined {
  return BASE_RECIPES.find(r => r.breadType === breadType)
}
