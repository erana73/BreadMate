# BreadMate — Project Plan

## App Summary

**BreadMate** is a web application for amateur bread bakers. It generates adjusted bread recipes based on user-selected parameters (flour type, bread type, kneading method, leavening), walks bakers through the process with timers and notifications, and includes a sourdough starter management log.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Web app (React) | Accessible everywhere, mobile-friendly later via PWA |
| Recipe engine | Hybrid: rules + Claude API | Rules handle common combos; AI handles edge cases |
| Data storage | Local (localStorage/IndexedDB) | Simple MVP; backend can be added later |
| Notifications | Browser Notifications API + in-app | Works while browser is open; PWA enables background |
| Styling | Tailwind CSS | Fast, responsive, clean UI |
| Build tool | Vite + React | Modern, fast, Claude Code handles it well |

---

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **State management:** React Context + useReducer (local)
- **Storage:** IndexedDB (via Dexie.js) for structured data persistence
- **Notifications:** Browser Notifications API
- **AI integration:** Anthropic API (Claude) for custom recipe generation
- **Build:** Vite
- **Deployment:** Vercel or Netlify (free tier)

---

## Feature Breakdown & Phases

### Phase 1 — Foundation ✅
> Goal: Project scaffold, core data models, basic UI shell

- [x] **1.1** Initialize project with Vite + React + TypeScript + Tailwind
- [x] **1.2** Define data models:
  - `Recipe` (name, flour type, bread type, hydration%, ingredients[], steps[], leavening, kneading method, complexity)
  - `Starter` (name, flour type, created date, feedings[])
  - `Feeding` (timestamp, flour amount, water amount, starter amount, notes)
  - `BakeSession` (recipe ref, start time, step progress, timer states)
- [x] **1.3** Set up IndexedDB with Dexie.js for local persistence
- [x] **1.4** Build app shell: navigation, main layout, responsive design
- [x] **1.5** Create routing: Home, New Bake, My Recipes, Starter Log, Active Bake

**Prompt for Claude Code:**
> "Initialize a Vite + React + TypeScript project with Tailwind CSS. Set up the folder structure with pages (Home, NewBake, MyRecipes, StarterLog, ActiveBake), a components folder, and a models folder. Install Dexie.js. Create TypeScript interfaces for Recipe, Starter, Feeding, and BakeSession. Set up React Router with routes for each page."

---

### Phase 2 — Recipe Builder ✅
> Goal: User can select parameters and get an adjusted recipe

- [x] **2.1** Build the recipe parameter selection form:
  - Flour type (9 types: bread, all-purpose, whole wheat, spelt, whole spelt, rye, whole rye, einkorn, gluten-free)
  - Bread type (sandwich loaf, artisan boule, focaccia, pizza dough, bagels)
  - Kneading method (hand knead, stand mixer, stretch & fold, no-knead)
  - Leavening (active dry yeast, instant yeast, sourdough starter, hybrid)
  - Complexity (beginner / intermediate / advanced)
- [x] **2.2** Build the rule-based recipe engine (`src/lib/recipeEngine.ts`):
  - Base recipe lookup table (`src/data/baseRecipes.ts`) — one per bread type
  - Hydration adjustment by flour type
  - Fermentation time multipliers by leavening type
  - Sourdough/hybrid levain prep steps prepended automatically
  - Kneading instruction overrides by method
  - Complexity step-count filtering
- [x] **2.3** Display the generated recipe: ingredients list (scaled), step-by-step instructions (`src/components/RecipeCard.tsx`)
- [x] **2.4** Save Recipe to IndexedDB via Dexie
- [ ] **2.5** Custom Recipe input form for user-created recipes

**Prompt for Claude Code:**
> "Create a recipe builder page. The user selects flour type, bread type, kneading method, leavening type, and complexity level from dropdowns. Build a rule-based engine that takes these parameters and generates an adjusted recipe. Store base recipes as JSON data. The engine should adjust hydration percentages, fermentation times, kneading instructions, and ingredient quantities. Display the result as a formatted recipe card with ingredients and steps. Add a 'Save Recipe' button that stores to IndexedDB via Dexie."

---

### Phase 3 — AI Recipe Enhancement ✅
> Goal: Claude API integration for custom/complex requests

- [x] **3.1** "✨ Ask AI for Recipe" button on New Bake page
- [x] **3.2** Claude API integration (`src/lib/aiRecipe.ts`):
  - System prompt with baking expertise context
  - Sends selected parameters + optional custom notes
  - Parses structured JSON recipe response (robust extraction tolerating markdown fences)
  - Sourdough/hybrid: AI prompted to include levain build + readiness steps
  - `VITE_ANTHROPIC_API_KEY` env var; model `claude-sonnet-4-6`, 4096 max tokens
- [x] **3.3** Custom request text field on New Bake form
- [x] **3.4** AI recipe displayed in same RecipeCard format
- [x] **3.5** Save AI recipes to IndexedDB; source tagged as `ai-generated`

**Note:** API key configured via `VITE_ANTHROPIC_API_KEY` in `.env`. See `.env.example`.

---

### Phase 4 — Bake Mode with Timers ✅
> Goal: Guided baking experience with timers and notifications

- [x] **4.1** "Start Bake" from My Recipes; "Save & Start Bake" from RecipeCard on New Bake
- [x] **4.2** **Guided mode** (`src/pages/ActiveBake.tsx`):
  - One step at a time with full instruction displayed
  - Timer auto-starts on arrival at each timer step
  - "Next Step" / "Skip" / "Finish Bake" button
  - Progress bar (% complete)
- [x] **4.3** **Overview mode:**
  - All steps listed; click any step to jump to it
  - Timer controls shown for the active step
  - Inline countdown shown for all running timers
  - Past steps marked with ✓
- [x] **4.4** Mode toggle button (Guided ↔ Overview)
- [x] **4.5** Timer features:
  - MM:SS / H:MM:SS countdown display
  - Web Audio API beep on completion
  - Browser notification on completion
  - Start / Pause / Resume / Reset / Snooze 5 min
- [x] **4.6** Notification permission requested on first bake
- [x] **4.7** BakeSession persisted to IndexedDB every 5 s; restored on page refresh; active session resumed automatically

---

### Phase 5 — Sourdough Starter Log ✅
> Goal: Track and manage sourdough starters with reminders

- [x] **5.1** Starter management page (`src/pages/StarterLog.tsx`):
  - Add new starter (name, flour type, feeding interval, default ratio)
  - Collapsible starter cards listing all starters with status
- [x] **5.2** Feeding log per starter:
  - Log Feeding form (starter retained, flour, water, timestamp, notes)
  - Feeding history table sorted newest-first with delete per entry
- [x] **5.3** Feeding schedule & reminders:
  - Editable feeding interval per starter (8h / 12h / 24h / 48h / 72h)
  - Next due time calculated from last feeding
  - Browser notification fired on page load if overdue; scheduled if due within 24h
  - Status badge: **Healthy** (green) / **Due Soon** (yellow, <2h) / **Overdue** (red)
- [x] **5.4** Multiple starters supported
- [x] **5.5** "Fed Now" quick button — logs feeding instantly with starter's default ratio

---

### Phase 6 — Polish & PWA (Week 5)
> Goal: Mobile-ready, installable, polished UX

- [ ] **6.1** Convert to PWA (Progressive Web App):
  - Service worker for offline support
  - Web app manifest
  - Install prompt
- [ ] **6.2** Responsive design review — test on mobile
- [ ] **6.3** Home screen:
  - Active bake status (if in progress)
  - Starter status summary
  - Quick actions (New Bake, Feed Starter)
- [ ] **6.4** My Recipes page:
  - List saved recipes (built-in + custom + AI-generated)
  - Search/filter by flour type, bread type
  - Delete recipes
- [ ] **6.5** UX polish: loading states, empty states, error messages, tooltips
- [ ] **6.6** Deploy to Vercel/Netlify

**Prompt for Claude Code:**
> "Convert the app to a PWA. Add a service worker with offline caching, a web manifest with app name 'BreadMate' and bread-themed icon. Review and fix all pages for mobile responsiveness. Build a Home page showing active bake status, starter health summary, and quick-action buttons. Add search and filter to the My Recipes page. Deploy configuration for Vercel."

---

## Data Model Reference

```
Recipe {
  id: string
  name: string
  source: "built-in" | "custom" | "ai-generated"
  flourType: string
  breadType: string
  kneadingMethod: string
  leavening: "active-dry-yeast" | "instant-yeast" | "sourdough" | "hybrid"
  complexity: "beginner" | "intermediate" | "advanced"
  hydration: number (percentage)
  ingredients: Ingredient[]
  steps: Step[]
  totalTime: number (minutes)
  createdAt: Date
}

Ingredient {
  name: string
  amount: number
  unit: "g" | "ml" | "tsp" | "tbsp" | "cup" | "piece"
}

Step {
  order: number
  title: string
  instruction: string
  duration: number | null (minutes, null = no timer)
  isTimerStep: boolean
  timerLabel: string
}

Starter {
  id: string
  name: string
  flourType: string
  createdAt: Date
  feedingIntervalHours: number
  defaultRatio: { flour: number, water: number, starter: number }
  feedings: Feeding[]
}

Feeding {
  id: string
  timestamp: Date
  flourAmount: number (grams)
  waterAmount: number (grams)
  starterRetained: number (grams)
  notes: string
}

BakeSession {
  id: string
  recipeId: string
  startedAt: Date
  currentStep: number
  mode: "guided" | "overview"
  timerStates: TimerState[]
  status: "active" | "paused" | "completed"
}

TimerState {
  stepIndex: number
  remaining: number (seconds)
  status: "idle" | "running" | "paused" | "completed" | "snoozed"
}
```

---

## Working with Claude Code — Tips

1. **One phase at a time.** Don't try to build everything in one prompt.
2. **Start each session** by telling Claude Code: "Read the project files and understand the current state before making changes."
3. **Test after each task.** Run `npm run dev` and verify in the browser before moving on.
4. **If something breaks,** paste the error message to Claude Code and ask it to fix it.
5. **Save working states.** Use git commits after each completed task: `git init`, `git add .`, `git commit -m "Phase 1 complete"`.
6. **For the AI integration (Phase 3),** you'll need an Anthropic API key. You already have one for your account — configure it as `VITE_ANTHROPIC_API_KEY` in a `.env` file.

---

## Future Enhancements (Post-MVP)

- Mixed flour support (multi-flour blends with combined hydration)
- Bake history & journal (rate results, add photos, track what worked)
- Starter rise tracking with sensory notes
- Recipe sharing (export/import JSON)
- Backend + user accounts for cross-device sync
- Temperature-based adjustments (ambient temp affects fermentation)
- Baker's percentage calculator tool
- Community recipe library
