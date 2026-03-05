import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'
import type { Recipe } from '../models'
import type { RecipeParams } from './recipeEngine'

const SYSTEM_PROMPT = `You are an expert artisan bread baker with deep knowledge of baking science, fermentation, and technique.

When the user provides bread parameters, you will return a complete, detailed recipe as a single JSON object matching this TypeScript interface exactly:

{
  "name": string,
  "flourType": string,
  "breadType": string,
  "kneadingMethod": string,
  "leavening": "active-dry-yeast" | "instant-yeast" | "sourdough" | "hybrid",
  "complexity": "beginner" | "intermediate" | "advanced",
  "hydration": number,
  "totalTime": number,
  "ingredients": Array<{ "name": string, "amount": number, "unit": "g" | "ml" | "tsp" | "tbsp" | "cup" | "piece" }>,
  "steps": Array<{
    "order": number,
    "title": string,
    "instruction": string,
    "duration": number | null,
    "isTimerStep": boolean,
    "timerLabel": string
  }>
}

Rules:
- Return ONLY the raw JSON object. No markdown, no code fences, no explanation text.
- "hydration" is a number representing baker's percentage (e.g. 70 for 70%).
- "totalTime" is total time in minutes (sum of all step durations where duration is not null).
- "duration" in steps is in minutes, or null if the step has no timer.
- "isTimerStep" is true when the step has a meaningful time to track.
- "timerLabel" is a short label for the timer (e.g. "First rise"), or empty string if no timer.
- Ingredient amounts should be realistic for a recipe yielding 1 loaf or 1 standard batch.
- All steps should be clear, practical, and appropriate for the stated complexity level.
- When leavening is "sourdough": the first two steps MUST be (1) levain build — combine 20 g refrigerated starter with flour + water (1:2:2 ratio), leave 8–12 h at room temperature until doubled and bubbly, duration 480 min, isTimerStep true, timerLabel "Levain build (8–12 h)"; (2) check levain readiness — confirm it has doubled, surface is domed and bubbly, floats in water, duration null, isTimerStep false. Include "Refrigerated starter (seed for levain)" (20 g) and "Active levain (100% hydration)" (100 g) in the ingredients.
- When leavening is "hybrid": the first step MUST be a levain build — combine 20 g refrigerated starter with flour + water (1:1:1 ratio), leave 4–6 h, duration 240 min, isTimerStep true, timerLabel "Levain build (4–6 h)". Include "Refrigerated starter (seed for levain)" (20 g), "Active levain" (50 g), and a small amount of instant yeast in the ingredients.`

function buildUserMessage(params: RecipeParams, customRequest: string): string {
  const lines = [
    `Bread type: ${params.breadType.replace(/-/g, ' ')}`,
    `Flour type: ${params.flourType.replace(/-/g, ' ')}`,
    `Kneading method: ${params.kneadingMethod.replace(/-/g, ' ')}`,
    `Leavening: ${params.leavening.replace(/-/g, ' ')}`,
    `Complexity level: ${params.complexity}`,
  ]
  if (customRequest.trim()) {
    lines.push(`Custom request: ${customRequest.trim()}`)
  }
  return lines.join('\n')
}

export async function generateAIRecipe(
  params: RecipeParams,
  customRequest: string,
  apiKey: string
): Promise<Recipe> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  let message
  try {
    message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(params, customRequest) }],
    })
  } catch (err: unknown) {
    console.error('[BreadMate] Anthropic API error:', err)
    // Surface Anthropic SDK error details (status, message, error body)
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>
      const status = e['status'] as number | undefined
      const errBody = e['error'] as Record<string, unknown> | undefined
      const detail = (errBody?.['message'] as string) ?? (e['message'] as string) ?? 'Unknown error'
      throw new Error(status ? `API error ${status}: ${detail}` : detail)
    }
    throw err
  }

  const textBlock = message.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from AI.')
  }

  // Extract JSON object from response, tolerating markdown fences or leading text
  const text = textBlock.text
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  const cleaned = start !== -1 && end !== -1 ? text.slice(start, end + 1) : text

  let raw: unknown
  try {
    raw = JSON.parse(cleaned)
  } catch {
    const preview = text.slice(0, 300)
    console.error('[BreadMate] stop_reason:', message.stop_reason)
    console.error('[BreadMate] Raw AI response (not valid JSON):', text)
    const truncated = message.stop_reason === 'max_tokens' ? ' (response was truncated)' : ''
    throw new Error(`AI returned invalid JSON${truncated}. Preview: ${preview}`)
  }

  const data = raw as Record<string, unknown>
  return {
    id: uuidv4(),
    source: 'ai-generated',
    name: String(data.name ?? 'AI Recipe'),
    flourType: String(data.flourType ?? params.flourType),
    breadType: String(data.breadType ?? params.breadType),
    kneadingMethod: String(data.kneadingMethod ?? params.kneadingMethod),
    leavening: (data.leavening as Recipe['leavening']) ?? params.leavening,
    complexity: (data.complexity as Recipe['complexity']) ?? params.complexity,
    hydration: Number(data.hydration ?? 65),
    totalTime: Number(data.totalTime ?? 120),
    ingredients: (data.ingredients as Recipe['ingredients']) ?? [],
    steps: (data.steps as Recipe['steps']) ?? [],
    createdAt: new Date(),
  }
}
