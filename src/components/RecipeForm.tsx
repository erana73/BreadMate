import type { Recipe } from '../models'
import type { RecipeParams } from '../lib/recipeEngine'
import {
  BREAD_TYPES, FLOUR_TYPES, KNEADING_METHODS, LEAVENING_TYPES, COMPLEXITY_LEVELS,
} from '../lib/recipeEngine'

interface Props {
  params: RecipeParams
  onChange: (params: RecipeParams) => void
  customRequest: string
  onCustomRequestChange: (value: string) => void
  onGenerate: () => void
  onAskAI: () => void
  isAILoading: boolean
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function RecipeForm({
  params, onChange, customRequest, onCustomRequestChange, onGenerate, onAskAI, isAILoading,
}: Props) {
  function set<K extends keyof RecipeParams>(key: K, value: RecipeParams[K]) {
    onChange({ ...params, [key]: value })
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-6 space-y-4">
      <h2 className="text-xl font-bold text-amber-900">Recipe Parameters</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Bread Type"
          value={params.breadType}
          onChange={v => set('breadType', v)}
          options={BREAD_TYPES}
        />
        <SelectField
          label="Flour Type"
          value={params.flourType}
          onChange={v => set('flourType', v)}
          options={FLOUR_TYPES}
        />
        <SelectField
          label="Kneading Method"
          value={params.kneadingMethod}
          onChange={v => set('kneadingMethod', v)}
          options={KNEADING_METHODS}
        />
        <SelectField
          label="Leavening"
          value={params.leavening}
          onChange={v => set('leavening', v as Recipe['leavening'])}
          options={LEAVENING_TYPES}
        />
        <SelectField
          label="Complexity"
          value={params.complexity}
          onChange={v => set('complexity', v as Recipe['complexity'])}
          options={COMPLEXITY_LEVELS}
        />
      </div>

      {/* Custom request for AI */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Request <span className="text-gray-400 font-normal">(optional — used by AI)</span>
        </label>
        <textarea
          value={customRequest}
          onChange={e => onCustomRequestChange(e.target.value)}
          rows={2}
          placeholder='e.g. "Add seeds and honey" or "Make it extra crispy"'
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          onClick={onGenerate}
          className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl transition-colors"
        >
          Generate Recipe
        </button>
        <button
          onClick={onAskAI}
          disabled={isAILoading}
          className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isAILoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Thinking…
            </>
          ) : (
            '✨ Ask AI for Recipe'
          )}
        </button>
      </div>
    </div>
  )
}
