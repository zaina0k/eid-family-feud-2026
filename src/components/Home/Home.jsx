import { useState } from 'react';
import { useGame, getAllQuestions } from '../../state/gameStore.jsx';
import { MAX_TEAMS, MIN_TEAMS } from '../../config.js';
import TeamCard from './TeamCard.jsx';
import TeamEditModal from './TeamEditModal.jsx';
import QuestionPicker from './QuestionPicker.jsx';

export default function Home() {
  const { state, dispatch } = useGame();
  const [editingTeamId, setEditingTeamId] = useState(null);

  const questions = getAllQuestions();
  const canStart =
    state.teams.length >= MIN_TEAMS && state.selectedQuestionIds.length >= 1;

  const editingTeam = state.teams.find((t) => t.id === editingTeamId) || null;

  return (
    <div className="home">
      <header className="home-header">
        <h1>Family Feud</h1>
        <p className="subtitle">Set up your teams, pick your questions, and play.</p>
      </header>

      <section className="card">
        <div className="card-head">
          <h2>Teams</h2>
          <div className="card-actions">
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'ADD_TEAM' })}
              disabled={state.teams.length >= MAX_TEAMS}
            >
              + Add team
            </button>
            <span className="hint">
              {state.teams.length} / {MAX_TEAMS} (min {MIN_TEAMS})
            </span>
          </div>
        </div>
        <div className="team-grid">
          {state.teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              canRemove={state.teams.length > MIN_TEAMS}
              onEdit={() => setEditingTeamId(team.id)}
              onRemove={() =>
                dispatch({ type: 'REMOVE_TEAM', teamId: team.id })
              }
            />
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Questions</h2>
          <div className="card-actions">
            <span className="hint">
              {state.selectedQuestionIds.length} selected of {questions.length}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'CLEAR_QUESTIONS' })}
              disabled={state.selectedQuestionIds.length === 0}
            >
              Clear selection
            </button>
          </div>
        </div>
        <QuestionPicker
          questions={questions}
          selectedIds={state.selectedQuestionIds}
          onToggle={(id) => dispatch({ type: 'TOGGLE_QUESTION', id })}
        />
      </section>

      <div className="start-row">
        <button
          className="btn btn-primary btn-large"
          disabled={!canStart}
          onClick={() => dispatch({ type: 'START_GAME' })}
        >
          Start Game
        </button>
        {!canStart && (
          <span className="hint">
            Need at least {MIN_TEAMS} teams and 1 question.
          </span>
        )}
      </div>

      {editingTeam && (
        <TeamEditModal
          team={editingTeam}
          otherTeams={state.teams.filter((t) => t.id !== editingTeam.id)}
          onClose={() => setEditingTeamId(null)}
          onSave={(patch) => {
            dispatch({ type: 'UPDATE_TEAM', teamId: editingTeam.id, patch });
            setEditingTeamId(null);
          }}
        />
      )}
    </div>
  );
}
