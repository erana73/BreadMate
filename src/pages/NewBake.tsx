import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Recipe } from '../models'
import type { RecipeParams } from '../lib/recipeEngine'
import { buildRecipe } from '../lib/recipeEngine'
import { generateAIRecipe } from '../lib/aiRecipe'
import { db } from '../db/database'
import RecipeForm from '../components/RecipeForm'
import RecipeCard from '../components/RecipeCard'

const DEFAULT_PARAMS: RecipeParams = {
  breadType: 'artisan-boule',
  flourType: 'whole-spelt',
  kneadingMethod: 'no-knead',
  leavening: 'sourdough',
  complexity: 'beginner',
}

export default function NewBake() {
  const navigate = useNavigate()
  const [params, setParams] = useState<RecipeParams>(DEFAULT_PARAMS)
  const [customRequest, setCustomRequest] = useState('')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiError, setAIError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState(false)

  function handleGenerate() {
    setAIError(null)
    setSavedMessage(false)
    const generated = buildRecipe(params)
    setRecipe(generated)
    if (!generated) {
      setAIError('No built-in recipe found for that bread type. Try "Ask AI for Recipe".')
    }
  }

  async function handleAskAI() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
    if (!apiKey) {
      setAIError('No API key found. Add VITE_ANTHROPIC_API_KEY to your .env file.')
      return
    }
    setIsAILoading(true)
    setAIError(null)
    setSavedMessage(false)
    try {
      const aiRecipe = await generateAIRecipe(params, customRequest, apiKey)
      setRecipe(aiRecipe)
    } catch (err) {
      setAIError(err instanceof Error ? err.message : 'AI request failed. Please try again.')
    } finally {
      setIsAILoading(false)
    }
  }

  function handleSaved() {
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 3000)
  }

  async function handleStartBake() {
    if (!recipe) return
    await db.recipes.put(recipe)
    navigate(`/active-bake?recipeId=${recipe.id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-900">New Bake</h1>
        <p className="mt-1 text-gray-500 text-sm">
          Pick your parameters and generate a recipe, or ask AI for something custom.
        </p>
      </div>

      <RecipeForm
        params={params}
        onChange={setParams}
        customRequest={customRequest}
        onCustomRequestChange={setCustomRequest}
        onGenerate={handleGenerate}
        onAskAI={handleAskAI}
        isAILoading={isAILoading}
      />

      {aiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {aiError}
        </div>
      )}

      {savedMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          Recipe saved to My Recipes!
        </div>
      )}

      {recipe && (
        <RecipeCard
          recipe={recipe}
          onSaved={handleSaved}
          onStartBake={handleStartBake}
        />
      )}
    </div>
  )
}
