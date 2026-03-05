import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Recipe } from '../models'
import { db } from '../db/database'

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const SOURCE_BADGE: Record<Recipe['source'], { label: string; className: string }> = {
  'built-in':    { label: 'Built-in',   className: 'bg-amber-100 text-amber-800' },
  'custom':      { label: 'Custom',     className: 'bg-blue-100 text-blue-800' },
  'ai-generated':{ label: 'AI',         className: 'bg-purple-100 text-purple-800' },
}

export default function MyRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    db.recipes.orderBy('createdAt').reverse().toArray().then(r => {
      setRecipes(r)
      setLoading(false)
    })
  }, [])

  async function deleteRecipe(id: string) {
    await db.recipes.delete(id)
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  if (loading) {
    return <div className="py-20 text-center text-amber-700">Loading…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-900">My Recipes</h1>
        <p className="mt-1 text-sm text-gray-500">Your saved recipes.</p>
      </div>

      {recipes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-md p-10 text-center">
          <p className="text-gray-500 mb-4">No saved recipes yet.</p>
          <button
            onClick={() => navigate('/new-bake')}
            className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl"
          >
            Generate a Recipe
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map(recipe => {
            const badge = SOURCE_BADGE[recipe.source]
            return (
              <div key={recipe.id} className="bg-white rounded-2xl border border-amber-100 shadow-md overflow-hidden">
                <div className="bg-amber-700 px-5 py-4 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-bold text-lg leading-snug">{recipe.name}</h2>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-amber-200 text-sm">
                    <span>⏱ {formatTime(recipe.totalTime)}</span>
                    <span>💧 {recipe.hydration}%</span>
                    <span className="capitalize">📊 {recipe.complexity}</span>
                  </div>
                </div>

                <div className="px-5 py-2.5 flex flex-wrap gap-1.5 text-xs text-gray-500 border-b border-gray-100">
                  <span className="capitalize">{recipe.breadType.replace(/-/g, ' ')}</span>
                  <span>·</span>
                  <span className="capitalize">{recipe.flourType.replace(/-/g, ' ')}</span>
                  <span>·</span>
                  <span className="capitalize">{recipe.leavening.replace(/-/g, ' ')}</span>
                </div>

                <div className="px-5 py-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/active-bake?recipeId=${recipe.id}`)}
                    className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl text-sm"
                  >
                    Start Bake
                  </button>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
