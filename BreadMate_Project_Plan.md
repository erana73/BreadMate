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

### Phase 1 — Foundation (Week 1)
> Goal: Project scaffold, core data models, basic UI shell

- [ ] **1.1** Initialize project with Vite + React + TypeScript + Tailwind
- [ ] **1.2** Define data models:
  - `Recipe` (name, flour type, bread type, hydration%, ingredients[], steps[], leavening, kneading method, complexity)
  - `Starter` (name, flour type, created date, feedings[])
  - `Feeding` (timestamp, flour amount, water amount, starter amount, notes)
  - `BakeSession` (recipe ref, start time, step progress, timer states)
- [ ] **1.3** Set up IndexedDB with Dexie.js for local persistence
- [ ] **1.4** Build app shell: navigation, main layout, responsive design
- [ ] **1.5** Create routing: Home, New Bake, My Recipes, Starter Log, Active Bake

**Prompt for Claude Code:**
> "Initialize a Vite + React + TypeScript project with Tailwind CSS. Set up the folder structure with pages (Home, NewBake, MyRecipes, StarterLog, ActiveBake), a components folder, and a models folder. Install Dexie.js. Create TypeScript interfaces for Recipe, Starter, Feeding, and BakeSession. Set up React Router with routes for each page."

---

### Phase 2 — Recipe Builder (Week 2)
> Goal: User can select parameters and get an adjusted recipe

- [ ] **2.1** Build the recipe parameter selection form:
  - Flour type (white, whole wheat, spelt, rye, etc.)
  - Bread type (sandwich loaf, artisan boule, focaccia, challah, bagels, pizza dough, etc.)
  - Kneading method (traditional hand knead, stand mixer, stretch & fold, no-knead)
  - Leavening (active dry yeast, instant yeast, sourdough starter, hybrid)
  - Complexity (beginner / intermediate / advanced)
- [ ] **2.2** Build the rule-based recipe engine:
  - Base recipe lookup table (one per bread type)
  - Adjustment rules for hydration by flour type
  - Adjustment rules for fermentation times by leavening type
  - Kneading instructions by method
  - Complexity filtering (hide/show advanced steps)
- [ ] **2.3** Display the generated recipe: ingredients list (scaled), step-by-step instructions
- [ ] **2.4** Add "Save Recipe" to local storage
- [ ] **2.5** Add "Custom Recipe" input form for user-created recipes

**Prompt for Claude Code:**
> "Create a recipe builder page. The user selects flour type, bread type, kneading method, leavening type, and complexity level from dropdowns. Build a rule-based engine that takes these parameters and generates an adjusted recipe. Store base recipes as JSON data. The engine should adjust hydration percentages, fermentation times, kneading instructions, and ingredient quantities. Display the result as a formatted recipe card with ingredients and steps. Add a 'Save Recipe' button that stores to IndexedDB via Dexie."

---

### Phase 3 — AI Recipe Enhancement (Week 2-3)
> Goal: Claude API integration for custom/complex requests

- [ ] **3.1** Add "Ask AI" button for when rule-based engine doesn't have a good match
- [ ] **3.2** Build Claude API integration:
  - System prompt with baking expertise context
  - Send user parameters + any custom notes
  - Parse structured recipe response
- [ ] **3.3** Add custom request text field ("I want a gluten-free sourdough with seeds")
- [ ] **3.4** Display AI-generated recipe in same format as rule-based
- [ ] **3.5** Allow saving AI recipes to local library

**Prompt for Claude Code:**
> "Add an AI recipe feature. When the user clicks 'Ask AI for Recipe', send their selected parameters plus an optional free-text request to the Anthropic API. Use a system prompt that instructs Claude to return a structured JSON recipe matching our Recipe interface. Parse the response and display it in the same recipe card format. Add a text input for custom requests like 'add seeds and honey'. Include loading state and error handling. The API key should be configurable via an environment variable."

**Important note:** For the MVP, the API key will need to be handled carefully. Options to discuss: environment variable during development, or a simple backend proxy later.

---

### Phase 4 — Bake Mode with Timers (Week 3)
> Goal: Guided baking experience with timers and notifications

- [ ] **4.1** Build "Start Bake" flow from any saved recipe
- [ ] **4.2** **Guided mode:**
  - Show one step at a time
  - Auto-start timer when step has a duration
  - "Next Step" button
  - Progress bar
- [ ] **4.3** **Overview mode:**
  - Show all steps
  - Manual start/pause/reset per timer
  - Highlight current step
- [ ] **4.4** Toggle between guided and overview modes
- [ ] **4.5** Timer features:
  - Countdown display (hours:minutes:seconds)
  - Audio alert when timer completes
  - Browser notification when timer completes
  - "Snooze 5 min" option
- [ ] **4.6** Request notification permission on first use
- [ ] **4.7** Persist bake session state (survive page refresh)

**Prompt for Claude Code:**
> "Build an ActiveBake page. When the user starts a bake from a recipe, create a BakeSession. Implement two modes: Guided (shows one step at a time with auto-timers and a progress bar) and Overview (shows all steps with individual timer controls). Each timer shows countdown in HH:MM:SS, plays an audio alert on completion, and sends a browser notification. Add a mode toggle. Persist the session state to IndexedDB so it survives page refresh. Include pause/resume and 'snooze 5 min' for completed timers."

---

### Phase 5 — Sourdough Starter Log (Week 4)
> Goal: Track and manage sourdough starters with reminders

- [ ] **5.1** Create starter management page:
  - Add new starter (name, flour type, creation date)
  - List all starters with status
- [ ] **5.2** Feeding log per starter:
  - Log feeding: flour amount, water amount, starter amount retained, timestamp
  - Feeding history table (sortable by date)
- [ ] **5.3** Feeding schedule & reminders:
  - Set feeding interval (e.g., every 12h, every 24h)
  - Calculate next feeding due time
  - Browser notification when feeding is due
  - Visual indicator: "Healthy" / "Due" / "Overdue"
- [ ] **5.4** Support multiple starters
- [ ] **5.5** Quick-log: "Fed now" button with default ratios

**Prompt for Claude Code:**
> "Build a Sourdough Starter Log page. Users can create multiple starters (name, flour type, creation date). Each starter has a feeding log where users record flour amount (g), water amount (g), starter retained (g), and timestamp. Display feeding history in a table. Add a feeding schedule: user sets interval (12h/24h/custom), the app calculates when the next feeding is due, and shows status as Healthy/Due/Overdue with color coding. Send browser notifications when feeding is due. Add a 'Fed Now' quick button that logs a feeding with the starter's default ratios. Store everything in IndexedDB."

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
