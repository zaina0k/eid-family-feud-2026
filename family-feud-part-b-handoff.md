# Family Feud — Part B handoff

Hand this file to the next Claude Code agent. It captures the state of the
codebase at the end of the refactor session and what still needs doing.

## What you're inheriting

The MVP (Part A of `family-feud-blueprint.md`) is built and a follow-up
refactor of the question-page game flow has been completed. The blueprint
itself was **not** edited — treat it as authoritative for the data model and
page contracts.

### Refactor that already shipped (do not redo)

- **Neutral start state.** `activeTeamId` is `null` at the start of every
  question and after every reset path:
  `initialState`, `START_GAME`, `CONTINUE_FROM_TRANSITION`,
  `ADD_MORE_QUESTIONS`, and `BACK_RESET_ROUND`. `REMOVE_TEAM` also clears it
  to `null` when the removed team was active.
- **New `SKIP_QUESTION` action** in `src/state/gameStore.jsx`. Only valid
  when `activeTeamId === null && !collected`. Pushes a zero-delta snapshot
  into `roundTotals`, flips `collected: true`, and advances to `transition`
  (or `end` if it was the final round). Wired to a "Skip question (0 to
  all)" button that is rendered **only** in the neutral pre-collection
  state.
- **`Collect Points` is disabled while neutral** with an explanatory
  tooltip. The team buttons at the bottom now double as face-off
  resolution; no separate face-off UI was added.
- **Active-team highlight.** `src/components/Question/TeamBar.jsx` —
  thicker team-coloured border, white box-shadow ring, slight lift, leading
  `●` marker, and contrast-aware label colour. Inactive team buttons sit on
  a solid dark surface with a team-coloured border (no more transparency
  bleed).
- **Contrast / legibility.** New helper `src/components/shared/contrast.js`
  exports `textOn(hex)` / `isLight(hex)` / `relativeLuminance(hex)` using
  WCAG luminance. `src/App.jsx` exposes `--page-bg` and `--page-fg` CSS
  variables on the root and sets `data-phase` so styles can scope. Prompt
  text (`.q-counter`, `.q-prompt`) and `.btn-ghost` in the question phase
  read `--page-fg`. Answer cards, strike panel, conduct row + per-team
  boxes, pot pill, and the new face-off banner all use solid `#1e293b` /
  `#0b1020` surfaces with `var(--text)` so the team colour no longer drives
  legibility.
- **Face-off banner.** A "Face-off — pick the team that buzzed first" hint
  is shown only when neutral and not collected.

### Files changed in the refactor

- `src/state/gameStore.jsx`
- `src/App.jsx`
- `src/components/shared/contrast.js` (new)
- `src/components/Question/Question.jsx`
- `src/components/Question/TeamBar.jsx`
- `src/styles.css`

### Verification status

The refactor was **not run-tested** — the dev environment did not have
Node/npm available. The code was reviewed but you should `npm install &&
npm run dev` and click through:

1. A question opens with no team selected and a neutral background.
2. `Collect Points` is disabled until a team is picked.
3. The `Skip question` control appears only in neutral state and advances
   with all scores unchanged.
4. The active team is visually unmistakable.
5. Prompt text is legible against every team colour (blue/red/green/amber
   are the defaults; try custom colours too).
6. Back button (mid-round, pre-collect) clears the active team back to
   neutral.
7. Conduct +10/-10 still functions in neutral state.
8. Settings modal still functions in neutral state.

---

## Your job: Part B extensions

Implement the items below from Part B of `family-feud-blueprint.md`. They
are independent — ship them in any order, each as its own self-contained
change.

**Implement:**

1. **State persistence (`localStorage`)** — auto-save game state on every
   reducer transition and a "Resume game" button on Home when a saved game
   exists. Discard or warn on schema-version mismatch.
2. **Random question fill** — restore the increase/decrease counter from
   the original spec on the Home screen as a "pick N at random from
   unplayed" helper. It complements the manual picker; the two must
   coexist.
3. **Routing (React Router)** — give each phase a URL so the browser back
   stack works. Phases stay driven by store state; the router just keeps
   the URL in sync.
4. **Full back/undo stack** — beyond the within-round Back button. Must
   include score-safe rollback across rounds (undoing a collected round
   restores `roundTotals` and team scores correctly).
6. **Sound & polish** — reveal ding, richer drumroll, board flip
   animations. **Skip the buzzer-on-strike** — see "Do not implement"
   below.
7. **Editable question set in-app** — add/edit/delete questions from Home
   without re-running `scripts/parse-questions.mjs`. Persist edits
   alongside state in `localStorage`.
8. **Multi-round formats** — round doubling (classic Feud: round 2 = 2×,
   round 3 = 3× — confirm the exact multipliers with the user) and/or a
   Fast Money round. Make doubling visible in the UI (e.g. "Round 3 — 3×"
   in the header and pot calculation).

**Do not implement** (decided with the product owner):

- **#5 Steal logic** — explicitly forbidden. The host adjudicates steals
  manually with the existing controls (switch active team, then collect
  the pot). Do **not** build strike-to-steal automation, a buzzer, a
  timer, or answer-correctness checking.
- **#9 TypeScript migration** — premature for the current codebase size.
  Revisit later.

### Rules to keep honouring

These came from the refactor session and must not regress:

- `activeTeamId === null` is the starting state of every question and the
  state after every reset path. No team is pre-selected, ever.
- The host adjudicates all rule logic. Software only tracks and reflects
  state. No automatic strike-to-steal, no answer-correctness checks, no
  buzzer/timer.
- When you add features that touch the question screen, keep the contrast
  rules: every interactive element should sit on its own solid surface or
  use the `--page-fg` variable so it stays readable on any team colour.
- Negative scores are allowed everywhere — do not clamp.
- Back button must remain hidden/disabled after `collected === true`
  within a round. The new undo stack (#4) is the only way to cross that
  boundary, and it must restore `roundTotals` and team scores correctly.

### Ask before guessing

Things in the blueprint that are genuinely ambiguous and worth confirming
with the user before implementation:

- Exact multipliers and which rounds get them for #8 (doubling).
- Whether Fast Money is in scope this session.
- Whether the in-app question editor (#7) should also allow deleting
  parsed questions or only adding/editing on top of the parsed set.
- Whether localStorage persistence (#1) should survive a code/schema
  change or just be discarded on mismatch.
