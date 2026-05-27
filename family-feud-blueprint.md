# Family Feud — Application Blueprint

A handoff specification for **Claude Code**. This document defines a locally-hosted web app for running a Family Feud game show. It is split into two parts:

- **Part A — MVP**: everything required for a playable game. Build this first, in one session.
- **Part B — Extensions**: deferred features. Hand these to a *separate* Claude Code agent afterwards to conserve context.

Build Part A completely and confirm it runs before touching Part B.

---

## 0. Decisions (locked)

These were confirmed with the product owner. Do not re-litigate them.

| Topic | Decision |
|---|---|
| Stack | **React + Vite**, single-page app, **no backend**. |
| Language | JavaScript (not TypeScript) unless you have a strong reason; keep it simple. |
| Questions source | Convert the markdown to **JSON once** (build-time script), app reads the JSON. |
| Settings password | **Frontend-only**, hardcoded in a config file. Not real security — a speed bump. |
| Strikes | **Manual visual counter only.** No automatic steal logic. |
| +10 / −10 buttons | **Host conduct controls**: a dedicated +10/−10 pair **per team** (no team-selector). The game master rewards/penalizes a specific team for respecting/breaking the rules. Independent of the pot. Scores **may go negative**. |
| Back button | Allowed **within a question, before Collect Points only.** |
| Question selection | **User manually picks** which questions to play, from the full set. |
| Collect Points | Assigns the current pot to the **active (FSM) team**. |
| Show All Answers | Reveals remaining answers, **adds nothing to the pot**; revealed answers stay revealed. |
| Round transition | Store **per-team running totals** (one snapshot per round); compute deltas on the fly. |
| Add-more-questions | Draws **new, unplayed** questions; caps at pool size and informs the user when exhausted. |
| Team count | Default 2, support **up to 4**. |
| Default question count | 7 (here: the count of manually-selected questions). |

---

## 1. Data model

### 1.1 Question JSON

Write a one-time build script (`scripts/parse-questions.mjs`) that reads `family-feud-selected.md` and emits `src/data/questions.json`. The markdown uses `1.` for *every* question (repeated ordinal) followed by `- Answer (points)` bullets. Parse by detecting `**bold**` lines as question prompts and `- … (N)` lines as answers.

```json
[
  {
    "id": 1,
    "prompt": "Name Something in a Bakery a Baker Might Call His Wife",
    "answers": [
      { "text": "Honey/Buns", "points": 32 },
      { "text": "His Oven", "points": 9 }
    ]
  }
]
```

- `id` = sequential index assigned at parse time (the markdown's repeated `1.` is unusable as an ID).
- Preserve answer order as written (already ranked high→low).
- Answer counts vary 4–8; never hardcode a count.

### 1.2 Team object

```js
{
  id: "team-1",
  name: "Team 1",
  color: "#3b82f6",   // hex; drives background + button + label colour
  score: 0
}
```

### 1.3 Game state (single store — Context + reducer, or Zustand)

```js
{
  phase: "home" | "question" | "transition" | "end",
  teams: Team[],
  selectedQuestionIds: number[],   // the manually-picked playlist, in play order
  currentRoundIndex: 0,            // index into selectedQuestionIds
  activeTeamId: "team-1",          // the FSM "who's playing" pointer
  pot: 0,                          // points currently in play this round
  strikes: 0,                      // 0..3, manual
  revealed: { [answerIndex]: true }, // which answers are flipped this round
  collected: false,               // has Collect Points fired this round?
  roundTotals: [                  // running totals snapshot per completed round
    { "team-1": 60, "team-2": 0 }
  ]
}
```

`roundTotals[i]` is the running total **after** round `i`. Delta for round `i` = `roundTotals[i][team] - roundTotals[i-1][team]` (treat `roundTotals[-1]` as all zeros).

---

## 2. Pages / phases

The app is a single page that swaps views based on `phase`. No router needed for the MVP (optional in extensions).

### 2.1 Home screen (`phase: "home"`)

- Welcome text / title.
- **Team management**: create teams (min 2, max 4). Each team shows in its own colour with an **Edit** button opening a **modal** to change name + colour. Provide add/remove team controls within the 2–4 bounds.
- **Question picker**: a scrollable checklist of all parsed questions (show the prompt text). Checking adds to `selectedQuestionIds` in the order checked (or file order — your call, document it).
- **Question count display**: shows the number currently selected. The increase/decrease counter from the original spec is **superseded** by the picker; show the live count instead of a free counter. (Random-fill counter is an extension — see Part B.)
- **Start Game** button: disabled until ≥2 teams exist and ≥1 question is selected. On click → `phase: "question"`, `currentRoundIndex: 0`.

### 2.2 Question screen (`phase: "question"`)

Layout:

- **Top**: question number (`currentRoundIndex + 1` of `selectedQuestionIds.length`) and the prompt.
- **Left**: the answer board. Each answer is a card showing text + points, **hidden by default**, with a **show/hide toggle**. Revealing a hidden answer **adds its points to the pot**; hiding it again **subtracts them** (keep pot consistent with what's currently revealed *before* collection).
- **Right**: three large **strike (✗) icons**. A **"Strike"** button increments `strikes` (0→3); provide a way to clear/decrement (manual). Purely visual.
- **Bottom**: one **team button per playing team**, labelled with the team name. Clicking sets `activeTeamId` (the FSM pointer). The **page background is dynamic** = active team's colour.
- **Host conduct controls**: for **each playing team**, a dedicated **+10** (reward) and **−10** (penalty) button pair, labelled with that team's name/colour. This lets the game master reward a team for respecting the rules or penalize one for breaking them, with no team-selection step — the buttons are unambiguously tied to their team. They adjust that team's `score` directly, are independent of the pot, and **may drive a score below zero** (a penalty is allowed to put a team in the negative). Group each pair with its team so there is no risk of nudging the wrong team.

**Round lifecycle on this screen:**

1. Players answer; host reveals answers (pot grows) and/or adds strikes.
2. Host clicks **Collect Points** → adds `pot` to the **active team's** score, sets `collected: true`, snapshots running totals into `roundTotals`. After collection: reveal-toggles no longer modify the pot.
3. After collection, show **Show All Answers** (reveals the rest, **no pot change**) and **Next Question**.
4. **Next Question** → if more rounds remain, `phase: "transition"`; else `phase: "end"`.

**Settings (on every question page):** a Settings entry opens a modal that **prompts for the hardcoded password**. Once unlocked it allows: manual score adjustment per team, rename team, recolour team. (See edge cases for why this exists.)

**Back button:** visible only while `collected === false`. It reverts within-question state (un-reveal, pot, strikes) or returns to the previous round's start. It must be **disabled/hidden once Collect Points has fired** to protect assigned scores.

### 2.3 Round-transition screen (`phase: "transition"`)

- Shows each team's **delta** for the round just played and their running total.
- Shows **questions remaining**.
- A **Continue** button → `phase: "question"`, `currentRoundIndex += 1`, and **resets per-round state**: `pot: 0`, `strikes: 0`, `revealed: {}`, `collected: false`.

### 2.4 End screen (`phase: "end"`)

- **Drumroll animation**, then reveal final scores when it completes. Declare a winner (handle ties — see edge cases).
- **Add more questions**: a counter (finite N) + an **Add** button. Adds N **new, unplayed** questions to `selectedQuestionIds`, jumps **straight to** `phase: "question"` at the first new round, and plays to the end, after which the end screen shows again.
- If the unplayed pool has fewer than N questions, add what's left and **tell the user**; if zero remain, disable Add.

---

## 3. Edge cases & end-states (must handle)

These cover real-game messiness and were explicitly requested.

1. **Collect Points with empty pot / no active team** — block or warn; never assign an undefined team.
2. **Revealing then hiding before collection** — pot must stay exactly equal to the sum of currently-revealed answers.
3. **Score driven negative by a penalty** — **negative scores are allowed.** Do not clamp at 0. Display negatives clearly (e.g. `−10`) on the question screen, transition screen, and end screen, and ensure delta calculations and the winner check handle negative running totals correctly.
4. **Settings used mid-round** to correct a refereeing mistake — score edits here must not corrupt `pot` or `roundTotals` already snapshotted.
5. **Back button after collection** — must be impossible (guarded by `collected`).
6. **Next Question pressed before Collect Points** — block; require collection (or an explicit "skip round, award 0") first.
7. **All answers revealed but not collected** — still valid; host may collect 0 or full pot depending on play.
8. **Ties at the end screen** — show co-winners rather than picking arbitrarily.
9. **Add-more-questions pool exhaustion** — cap + inform, as above.
10. **Reloading the page** — MVP may lose state (acceptable). Note this; persistence is an extension.
11. **Two teams sharing a colour** — prevent or visually disambiguate.
12. **Question with the fewest (4) vs most (8) answers** — board must lay out cleanly for both; no fixed slot count.
13. **Strikes maxed at 3** — manual counter should not exceed 3 or go below 0.

---

## 4. Project structure (suggested)

```
family-feud/
  scripts/parse-questions.mjs     # md -> json, run once
  src/
    data/questions.json           # generated
    state/gameStore.js            # reducer/store + actions
    components/
      Home/ (TeamCard, TeamEditModal, QuestionPicker)
      Question/ (AnswerBoard, AnswerCard, StrikePanel, TeamBar, ConductControls, SettingsModal)
      Transition/
      End/ (Drumroll, AddQuestions)
    config.js                     # SETTINGS_PASSWORD, default colours, defaults
    App.jsx                       # phase switch
    main.jsx
  index.html
  package.json
  vite.config.js
  README.md
```

---

## 5. How to run (include in README)

```bash
# Prereqs: Node.js 18+ and npm
npm create vite@latest family-feud -- --template react
cd family-feud
npm install

# one-time: generate questions.json from the markdown
node scripts/parse-questions.mjs

# develop
npm run dev      # serves on http://localhost:5173

# production-style local host
npm run build
npm run preview  # serves the built app locally
```

The app is fully client-side; "hosted locally" = the Vite dev/preview server. No database, no API keys, nothing leaves the machine.

---

# Part B — Extensions (separate agent, later)

Build only after the MVP runs. Each is independent.

1. **State persistence** — save game state to `localStorage` so reloads don't lose progress; "Resume game" on home.
2. **Random question fill** — restore the increase/decrease counter as a "pick N at random from unplayed" helper, complementing the manual picker.
3. **Routing** — React Router for shareable/back-stack navigation per phase.
4. **Full back/undo stack** — beyond the within-round limit, with score-safe rollback across rounds.
5. **Steal logic** — when a team hits 3 strikes, give the other team one steal attempt that can win the pot.
6. **Sound & polish** — buzzer on strike, ding on reveal, richer drumroll, board flip animations.
7. **Editable question set in-app** — add/edit questions without re-running the parse script.
8. **Multi-round formats** — double points on later rounds (classic Family Feud doubling), Fast Money round.
9. **TypeScript migration** if the codebase grows.

---

*Source data: `family-feud-selected.md` (38 questions, 4–8 answers each).*
