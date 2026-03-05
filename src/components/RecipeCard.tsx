import type { Recipe } from '../models'
import { db } from '../db/database'

interface Props {
  recipe: Recipe
  onSaved?: () => void
  onStartBake?: () => void
}

const SOURCE_BADGE: Record<Recipe['source'], { label: string; className: string }> = {
  'built-in': { label: 'Built-in', className: 'bg-amber-100 text-amber-800' },
  'custom': { label: 'Custom', className: 'bg-blue-100 text-blue-800' },
  'ai-generated': { label: 'AI Generated', className: 'bg-purple-100 text-purple-800' },
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function RecipeCard({ recipe, onSaved, onStartBake }: Props) {
  const badge = SOURCE_BADGE[recipe.source]

  async function handleSave() {
    await db.recipes.put(recipe)
    onSaved?.()
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-amber-100 overflow-hidden">
      {/* Header */}
      <div className="bg-amber-700 px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-bold leading-snug">{recipe.name}</h2>
          <span className={`shrink-0 mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-amber-200 text-sm">
          <span>⏱ {formatTime(recipe.totalTime)}</span>
          <span>💧 {recipe.hydration}% hydration</span>
          <span className="capitalize">📊 {recipe.complexity}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Ingredients */}
        <section>
          <h3 className="text-lg font-semibold text-amber-900 mb-3">Ingredients</h3>
          <ul className="space-y-1.5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex justify-between text-sm text-gray-700 border-b border-gray-100 pb-1.5">
                <span>{ing.name}</span>
                <span className="font-medium text-amber-800">{ing.amount} {ing.unit}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Steps */}
        <section>
          <h3 className="text-lg font-semibold text-amber-900 mb-3">Steps</h3>
          <ol className="space-y-4">
            {recipe.steps.map(step => (
              <li key={step.order} className="flex gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-amber-700 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                  {step.order}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{step.title}</span>
                    {step.duration !== null && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        ⏱ {formatTime(step.duration)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{step.instruction}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Action buttons */}
        {(onSaved || onStartBake) && (
          <div className="flex gap-2">
            {onSaved && (
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl transition-colors"
              >
                Save Recipe
              </button>
            )}
            {onStartBake && (
              <button
                onClick={onStartBake}
                className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition-colors"
              >
                Save & Start Bake
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
