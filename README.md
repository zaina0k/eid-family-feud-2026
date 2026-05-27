# Family Feud — local game show

A locally-hosted, single-page Family Feud app for running the game in person.
React + Vite, JavaScript, no backend, no network calls. Everything runs in
the browser; the Vite dev/preview server only serves static assets.

This is the MVP (Part A of the blueprint). Part B extensions (persistence,
random fill, routing, full undo, steal logic, sound, in-app editing,
multi-round formats) are intentionally **not** built here.

---

## Prerequisites

- Node.js **18+** and npm
- The source markdown `family-feud-selected.md` must exist **next to** this
  project folder (i.e. `..\family-feud-selected.md` relative to the project
  root). The parser reads it from there.

```
your-folder/
  family-feud-blueprint.md
  family-feud-selected.md     <-- parser reads this
  family-feud/                <-- THIS project
    package.json
    ...
```

---

## Run it

```bash
cd family-feud

# 1) Install dependencies
npm install

# 2) One-time: generate src/data/questions.json from the markdown.
#    Re-run this only if family-feud-selected.md changes.
npm run parse

# 3) Develop
npm run dev          # http://localhost:5173 (or whatever Vite picks)

# 4) Production-style local host
npm run build
npm run preview
```

A reducer smoke test (covers pot math, conduct, collect, deltas, negatives,
ties) is available:

```bash
node scripts/smoke-test.mjs
```

---

## Settings password

The Settings modal on the Question screen is locked behind a hardcoded
password defined in `src/config.js`:

```js
export const SETTINGS_PASSWORD = 'feud2026';
```

Change it there. This is a speed bump, **not** real security — anyone with
the source can read it.

---

## Game flow

1. **Home** — Create 2-4 teams (name + colour via the Edit modal). Pick
   questions from the checklist; the order you check them is the play order.
   "Start Game" lights up once you have ≥2 teams and ≥1 question.
2. **Question** — Reveal answers (pot grows), strike when wrong, pick which
   team is active, use the per-team conduct buttons to reward/penalize.
   **Collect Points** awards the pot to the active team. After collection
   you can **Show All Answers** (cosmetic, no pot change) and move on.
3. **Transition** — Per-team delta for the round + running total + how many
   questions remain.
4. **End** — Drumroll, then the final standings with the winner (co-winners
   on ties). "Add more questions" picks new unplayed ones and resumes play.

---

## Rules baked in (matching the blueprint)

- **Conduct +10/−10 buttons are per-team and independent of the pot.**
  Scores **may go negative** and are displayed with U+2212 ("−10").
- **Pot equals the sum of currently-revealed answers** until Collect Points
  fires. Hiding an answer subtracts. After collection the pot is frozen
  and reveal toggles are inert.
- **Back / reset is only available before Collect Points.** Once the pot is
  collected, the Back button is hidden — the round's scoring is sealed.
- **Next Question is hidden until Collect Points fires.** To skip a round
  without awarding anything, click Collect Points with an empty pot (awards
  0) and then Next.
- **Show All Answers reveals remaining answers post-collection only and
  adds nothing to the pot.**
- **Round totals are snapshotted at collection time.** Deltas are computed
  as `totals[i] - totals[i-1]` (with `totals[-1] = 0`). Manual mid-game
  Settings edits change the live team score but do **not** retroactively
  rewrite prior snapshots — historical deltas stay truthful to what
  actually happened in play.
- **Strikes are manual, clamped 0..3.** No auto-steal logic.
- **Adding more questions** at the end uses only unplayed pool entries and
  caps at the pool size; the user is told if fewer than requested are
  available.
- **Reloading the page loses state.** MVP only; persistence is Part B.
- **Ties at the end show co-winners** rather than picking arbitrarily.

---

## File map

```
family-feud/
  scripts/
    parse-questions.mjs        # md -> src/data/questions.json
    smoke-test.mjs             # reducer math sanity check (no browser)
  src/
    data/questions.json        # generated, do not edit by hand
    state/gameStore.jsx        # Context + reducer (single source of truth)
    config.js                  # SETTINGS_PASSWORD, palette, bounds
    components/
      Home/                    # TeamCard, TeamEditModal, QuestionPicker
      Question/                # AnswerBoard, AnswerCard, StrikePanel,
                               # TeamBar, ConductControls, SettingsModal
      Transition/
      End/                     # Drumroll, AddQuestions
      shared/                  # Modal, format
    App.jsx                    # phase switch + dynamic background
    main.jsx
    styles.css
  index.html
  vite.config.js
  package.json
```
