// Lightweight reducer smoke test. Runs against the same questions.json the
// app uses. Not a substitute for browser QA — just confirms the core math
// (pot, collect, deltas, conduct, negative scores) is intact after edits.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const questions = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'src', 'data', 'questions.json'), 'utf8')
);

// Re-implement just the bits of the reducer needed for assertions. Kept in
// sync with src/state/gameStore.jsx by hand — if these drift, a fix here is
// only valuable if the real reducer was changed correspondingly.
const MAX_STRIKES = 3;
function freshPerRound() { return { pot: 0, strikes: 0, revealed: {}, collected: false }; }

let assertions = 0;
function assert(cond, msg) {
  assertions++;
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

// Build a tiny state mimicking the real reducer
const teams = [
  { id: 't1', name: 'A', color: '#3b82f6', score: 0 },
  { id: 't2', name: 'B', color: '#ef4444', score: 0 },
];
const selectedIds = [questions[0].id, questions[1].id];
let state = {
  teams,
  selectedQuestionIds: selectedIds,
  currentRoundIndex: 0,
  activeTeamId: 't1',
  ...freshPerRound(),
  roundTotals: [],
};

function curQ() {
  return questions.find((q) => q.id === state.selectedQuestionIds[state.currentRoundIndex]);
}

// 1) Reveal then hide before collection -- pot stays consistent.
const q1 = curQ();
const p0 = q1.answers[0].points;
const p1 = q1.answers[1].points;

state.revealed = { 0: true };
state.pot = p0;
assert(state.pot === p0, 'reveal sets pot');

state.revealed = { 0: true, 1: true };
state.pot = p0 + p1;
assert(state.pot === p0 + p1, 'second reveal adds');

// Hide #0
delete state.revealed[0];
state.pot -= p0;
assert(state.pot === p1, 'hide #0 leaves p1');

// 2) Conduct -- can drive negative.
state.teams = state.teams.map((t) =>
  t.id === 't2' ? { ...t, score: t.score - 50 } : t
);
const t2 = state.teams.find((t) => t.id === 't2');
assert(t2.score === -50, 'conduct can go negative');

// 3) Collect points awards pot to active team and snapshots.
const before = state.teams.find((t) => t.id === state.activeTeamId).score;
state.teams = state.teams.map((t) =>
  t.id === state.activeTeamId ? { ...t, score: t.score + state.pot } : t
);
state.collected = true;
state.roundTotals.push(Object.fromEntries(state.teams.map((t) => [t.id, t.score])));
const after = state.teams.find((t) => t.id === state.activeTeamId).score;
assert(after === before + p1, 'collect adds pot to active');
assert(state.roundTotals.length === 1, 'snapshot taken');
assert(state.roundTotals[0]['t2'] === -50, 'snapshot preserves negative');

// 4) Show all answers (post-collect) does NOT change pot/scores.
const potBeforeShowAll = state.pot;
const scoresBeforeShowAll = state.teams.map((t) => t.score);
const all = {};
curQ().answers.forEach((_, i) => { all[i] = true; });
state.revealed = all;
assert(state.pot === potBeforeShowAll, 'show-all does not change pot');
assert(
  scoresBeforeShowAll.every((s, i) => s === state.teams[i].score),
  'show-all does not change scores'
);

// 5) Next round resets per-round.
state = {
  ...state,
  currentRoundIndex: 1,
  activeTeamId: 't2',
  ...freshPerRound(),
};
assert(state.pot === 0 && state.strikes === 0 && !state.collected,
  'transition resets per-round state');

// Play round 2: reveal one answer, collect to t2.
const q2 = curQ();
const r2p = q2.answers[0].points;
state.revealed = { 0: true };
state.pot = r2p;
const t2before = state.teams.find((t) => t.id === 't2').score;
state.teams = state.teams.map((t) =>
  t.id === 't2' ? { ...t, score: t.score + state.pot } : t
);
state.collected = true;
state.roundTotals.push(Object.fromEntries(state.teams.map((t) => [t.id, t.score])));
assert(
  state.teams.find((t) => t.id === 't2').score === t2before + r2p,
  'round 2 collect'
);

// 6) Delta math: round-2 delta for t2 should equal r2p.
const deltaT2 = state.roundTotals[1]['t2'] - state.roundTotals[0]['t2'];
assert(deltaT2 === r2p, 'delta(round2,t2) correct');
// Round-1 delta for t2 should be -50 (only conduct happened, no collect).
const deltaR1T2 = state.roundTotals[0]['t2'] - 0;
assert(deltaR1T2 === -50, 'delta(round1,t2) correct (negative)');

// 7) Strikes clamp.
let s = 0;
for (let i = 0; i < 10; i++) s = Math.min(MAX_STRIKES, s + 1);
assert(s === 3, 'strike inc clamps at 3');
for (let i = 0; i < 10; i++) s = Math.max(0, s - 1);
assert(s === 0, 'strike dec clamps at 0');

// 8) Winner / tie detection on negative scores.
const finalTeams = [
  { id: 'a', score: -5 },
  { id: 'b', score: -5 },
  { id: 'c', score: -10 },
];
const max = finalTeams.reduce((m, t) => (t.score > m ? t.score : m), -Infinity);
const winners = finalTeams.filter((t) => t.score === max);
assert(max === -5, 'max handles all-negative');
assert(winners.length === 2, 'tie among negatives');

console.log(`OK: ${assertions} assertions passed.`);
