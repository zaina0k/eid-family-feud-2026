// Single-source-of-truth game state store.
//
// Phases: home -> question -> transition -> end.
// All cross-cutting decisions (reveal, pot math, strikes, conduct +/-, collect,
// show-all, next, add-more) flow through this reducer so the rules in the
// blueprint (especially section 3 edge cases) live in one place.

import React, { createContext, useContext, useMemo, useReducer } from 'react';
import questionsData from '../data/questions.json';
import { DEFAULT_COLORS, MAX_STRIKES, MIN_TEAMS } from '../config.js';

const QUESTIONS_BY_ID = new Map(questionsData.map((q) => [q.id, q]));

export function getQuestionById(id) {
  return QUESTIONS_BY_ID.get(id);
}

export function getAllQuestions() {
  return questionsData;
}

function freshPerRound() {
  return { pot: 0, strikes: 0, revealed: {}, collected: false };
}

function makeTeam(index, existingTeams = []) {
  const usedColors = new Set(existingTeams.map((t) => t.color));
  const color =
    DEFAULT_COLORS.find((c) => !usedColors.has(c)) ||
    DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  return {
    id: `team-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
    name: `Team ${index + 1}`,
    color,
    score: 0,
  };
}

function initialState() {
  const teams = [makeTeam(0), makeTeam(1)];
  return {
    phase: 'home',
    teams,
    selectedQuestionIds: [],
    currentRoundIndex: 0,
    activeTeamId: null,
    ...freshPerRound(),
    roundTotals: [],
  };
}

function currentQuestion(state) {
  const id = state.selectedQuestionIds[state.currentRoundIndex];
  return id != null ? getQuestionById(id) : null;
}

function reducer(state, action) {
  switch (action.type) {
    // ----- Home -----
    case 'ADD_TEAM': {
      if (state.teams.length >= 4) return state;
      const team = makeTeam(state.teams.length, state.teams);
      return { ...state, teams: [...state.teams, team] };
    }
    case 'REMOVE_TEAM': {
      if (state.teams.length <= MIN_TEAMS) return state;
      const teams = state.teams.filter((t) => t.id !== action.teamId);
      const activeTeamId =
        state.activeTeamId === action.teamId ? null : state.activeTeamId;
      return { ...state, teams, activeTeamId };
    }
    case 'UPDATE_TEAM': {
      const teams = state.teams.map((t) =>
        t.id === action.teamId ? { ...t, ...action.patch } : t
      );
      return { ...state, teams };
    }
    case 'TOGGLE_QUESTION': {
      const has = state.selectedQuestionIds.includes(action.id);
      const selectedQuestionIds = has
        ? state.selectedQuestionIds.filter((x) => x !== action.id)
        : [...state.selectedQuestionIds, action.id];
      return { ...state, selectedQuestionIds };
    }
    case 'CLEAR_QUESTIONS':
      return { ...state, selectedQuestionIds: [] };

    case 'START_GAME': {
      if (state.teams.length < MIN_TEAMS) return state;
      if (state.selectedQuestionIds.length === 0) return state;
      return {
        ...state,
        phase: 'question',
        currentRoundIndex: 0,
        activeTeamId: null,
        ...freshPerRound(),
        roundTotals: [],
      };
    }

    // ----- Question (within-round) -----
    case 'SET_ACTIVE_TEAM':
      return { ...state, activeTeamId: action.teamId };

    case 'TOGGLE_REVEAL': {
      const q = currentQuestion(state);
      if (!q) return state;
      const answer = q.answers[action.index];
      if (!answer) return state;
      const wasRevealed = !!state.revealed[action.index];
      const revealed = { ...state.revealed };
      let pot = state.pot;
      if (wasRevealed) {
        delete revealed[action.index];
        if (!state.collected) pot -= answer.points;
      } else {
        revealed[action.index] = true;
        if (!state.collected) pot += answer.points;
      }
      return { ...state, revealed, pot };
    }

    case 'STRIKE_INC':
      return { ...state, strikes: Math.min(MAX_STRIKES, state.strikes + 1) };
    case 'STRIKE_DEC':
      return { ...state, strikes: Math.max(0, state.strikes - 1) };
    case 'STRIKE_RESET':
      return { ...state, strikes: 0 };

    case 'CONDUCT_ADJUST': {
      // Conduct +/- buttons — independent of the pot. Scores may go negative.
      const teams = state.teams.map((t) =>
        t.id === action.teamId ? { ...t, score: t.score + action.delta } : t
      );
      return { ...state, teams };
    }

    case 'SETTINGS_SET_SCORE': {
      // Manual mid-game correction. Does NOT touch pot or any prior round
      // snapshot — those stay frozen for delta math integrity.
      const teams = state.teams.map((t) =>
        t.id === action.teamId ? { ...t, score: action.value } : t
      );
      return { ...state, teams };
    }

    case 'COLLECT_POINTS': {
      if (state.collected) return state;
      if (!state.activeTeamId) return state;
      const teams = state.teams.map((t) =>
        t.id === state.activeTeamId ? { ...t, score: t.score + state.pot } : t
      );
      const snapshot = Object.fromEntries(teams.map((t) => [t.id, t.score]));
      return {
        ...state,
        teams,
        collected: true,
        roundTotals: [...state.roundTotals, snapshot],
      };
    }

    case 'SHOW_ALL_ANSWERS': {
      // Post-collection only. Reveals remaining answers; does NOT change pot
      // or scores. Pot is frozen because collected === true.
      if (!state.collected) return state;
      const q = currentQuestion(state);
      if (!q) return state;
      const revealed = { ...state.revealed };
      q.answers.forEach((_, i) => {
        revealed[i] = true;
      });
      return { ...state, revealed };
    }

    case 'BACK_RESET_ROUND': {
      // Back button — allowed ONLY when not yet collected. Reverts within-round
      // state (un-reveal, clear pot, clear strikes, drop active team back to
      // neutral so the host re-runs the face-off). Cannot un-collect.
      if (state.collected) return state;
      return { ...state, activeTeamId: null, ...freshPerRound() };
    }

    case 'SKIP_QUESTION': {
      // Host throws the question out (e.g. all teams refused / dispute).
      // Awards zero to everyone but still snapshots running totals so the
      // transition screen has a consistent per-round entry.
      if (state.collected) return state;
      if (state.activeTeamId !== null) return state;
      const snapshot = Object.fromEntries(
        state.teams.map((t) => [t.id, t.score])
      );
      const roundTotals = [...state.roundTotals, snapshot];
      const next = state.currentRoundIndex + 1;
      if (next >= state.selectedQuestionIds.length) {
        return { ...state, roundTotals, collected: true, phase: 'end' };
      }
      return { ...state, roundTotals, collected: true, phase: 'transition' };
    }

    case 'NEXT_QUESTION': {
      if (!state.collected) return state; // guarded by UI; double-check here
      const next = state.currentRoundIndex + 1;
      if (next >= state.selectedQuestionIds.length) {
        return { ...state, phase: 'end' };
      }
      return { ...state, phase: 'transition' };
    }

    case 'CONTINUE_FROM_TRANSITION': {
      const next = state.currentRoundIndex + 1;
      return {
        ...state,
        phase: 'question',
        currentRoundIndex: next,
        activeTeamId: null,
        ...freshPerRound(),
      };
    }

    case 'ADD_MORE_QUESTIONS': {
      // Adds up to N new (unplayed and unselected) questions. Caps at pool.
      const used = new Set(state.selectedQuestionIds);
      const available = questionsData.map((q) => q.id).filter((id) => !used.has(id));
      const toAdd = available.slice(0, action.count);
      if (toAdd.length === 0) return state;
      const selectedQuestionIds = [...state.selectedQuestionIds, ...toAdd];
      const nextIndex = state.currentRoundIndex + 1;
      return {
        ...state,
        selectedQuestionIds,
        currentRoundIndex: nextIndex,
        phase: 'question',
        activeTeamId: null,
        ...freshPerRound(),
      };
    }

    case 'RESET_TO_HOME':
      return initialState();

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}

// Helper: delta for team at a given round index, treating "before round 0"
// as zero. Used by Transition and End screens.
export function deltaForRound(state, teamId, roundIdx) {
  const after = state.roundTotals[roundIdx]?.[teamId] ?? 0;
  const before = roundIdx > 0 ? state.roundTotals[roundIdx - 1]?.[teamId] ?? 0 : 0;
  return after - before;
}
