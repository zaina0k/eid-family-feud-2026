import { useState } from 'react';
import { useGame, getQuestionById } from '../../state/gameStore.jsx';
import AnswerBoard from './AnswerBoard.jsx';
import StrikePanel from './StrikePanel.jsx';
import TeamBar from './TeamBar.jsx';
import ConductControls from './ConductControls.jsx';
import SettingsModal from './SettingsModal.jsx';
import { formatPoints } from '../shared/format.js';

export default function Question() {
  const { state, dispatch } = useGame();
  const [showSettings, setShowSettings] = useState(false);

  const question = getQuestionById(state.selectedQuestionIds[state.currentRoundIndex]);
  if (!question) {
    return (
      <div className="phase phase-question">
        <p>No question loaded.</p>
      </div>
    );
  }

  const activeTeam = state.teams.find((t) => t.id === state.activeTeamId);
  const neutral = !activeTeam;
  const total = state.selectedQuestionIds.length;
  const allRevealed = question.answers.every((_, i) => state.revealed[i]);
  const isLastRound = state.currentRoundIndex === total - 1;

  return (
    <div className="phase phase-question">
      <header className="q-header">
        <div className="q-title">
          <span className="q-counter">
            Question {state.currentRoundIndex + 1} of {total}
          </span>
          <h2 className="q-prompt">{question.prompt}</h2>
        </div>
        <div className="q-meta">
          <div className="pot-pill">
            Pot: <strong>{formatPoints(state.pot)}</strong>
          </div>
          <button
            className="btn btn-ghost btn-small"
            onClick={() => setShowSettings(true)}
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      {neutral && !state.collected && (
        <div className="face-off-banner">
          Face-off — pick the team that buzzed first to make them active.
        </div>
      )}

      <div className="q-body">
        <div className="q-left">
          <AnswerBoard
            answers={question.answers}
            revealed={state.revealed}
            onToggle={(i) => dispatch({ type: 'TOGGLE_REVEAL', index: i })}
            locked={state.collected}
          />
        </div>
        <div className="q-right">
          <StrikePanel
            strikes={state.strikes}
            onInc={() => dispatch({ type: 'STRIKE_INC' })}
            onDec={() => dispatch({ type: 'STRIKE_DEC' })}
            onReset={() => dispatch({ type: 'STRIKE_RESET' })}
          />
        </div>
      </div>

      <TeamBar
        teams={state.teams}
        activeTeamId={state.activeTeamId}
        onPick={(teamId) =>
          !state.collected && dispatch({ type: 'SET_ACTIVE_TEAM', teamId })
        }
        locked={state.collected}
      />

      <ConductControls
        teams={state.teams}
        onAdjust={(teamId, delta) =>
          dispatch({ type: 'CONDUCT_ADJUST', teamId, delta })
        }
      />

      <footer className="q-footer">
        {!state.collected && (
          <button
            className="btn btn-secondary"
            onClick={() => dispatch({ type: 'BACK_RESET_ROUND' })}
            title="Reset this question's reveals, strikes, pot, and active team"
          >
            ← Back / Reset round
          </button>
        )}
        {!state.collected ? (
          <>
            {neutral && (
              <button
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'SKIP_QUESTION' })}
                title="Throw out this question — awards 0 to all teams and moves on"
              >
                Skip question (0 to all)
              </button>
            )}
            <button
              className="btn btn-primary btn-large"
              onClick={() => dispatch({ type: 'COLLECT_POINTS' })}
              disabled={neutral}
              title={
                neutral
                  ? 'Pick an active team first — a pot cannot be awarded to nobody.'
                  : state.pot === 0
                  ? 'Pot is empty — collecting will award 0'
                  : `Award ${formatPoints(state.pot)} to ${activeTeam.name}`
              }
            >
              Collect Points
              {activeTeam && (
                <span className="btn-sublabel">
                  → {activeTeam.name} ({formatPoints(state.pot)})
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'SHOW_ALL_ANSWERS' })}
              disabled={allRevealed}
            >
              Show All Answers
            </button>
            <button
              className="btn btn-primary btn-large"
              onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
            >
              {isLastRound ? 'Finish →' : 'Next Question →'}
            </button>
          </>
        )}
      </footer>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
