import { useEffect, useState } from 'react';
import { useGame, getAllQuestions } from '../../state/gameStore.jsx';
import { DEFAULT_ADD_COUNT } from '../../config.js';
import Drumroll from './Drumroll.jsx';
import AddQuestions from './AddQuestions.jsx';
import { formatPoints } from '../shared/format.js';

export default function End() {
  const { state, dispatch } = useGame();
  const [revealed, setRevealed] = useState(false);

  // Reset the drumroll when scores change (i.e. user added more questions and
  // came back) — but the End screen unmounts in that flow, so this is just
  // defensive.
  useEffect(() => {
    setRevealed(false);
  }, []);

  // Winner / co-winners: handle ties + negative scores (max may itself be negative).
  const maxScore = state.teams.reduce(
    (m, t) => (t.score > m ? t.score : m),
    -Infinity
  );
  const winners = state.teams.filter((t) => t.score === maxScore);
  const isTie = winners.length > 1;

  const sortedTeams = [...state.teams].sort((a, b) => b.score - a.score);

  const totalQuestions = getAllQuestions().length;
  const unplayed = totalQuestions - state.selectedQuestionIds.length;

  return (
    <div className="phase phase-end">
      {!revealed ? (
        <Drumroll onDone={() => setRevealed(true)} />
      ) : (
        <div className="end-card">
          <h2 className="winner-headline">
            {isTie
              ? `It's a tie! ${winners.map((w) => w.name).join(' & ')}`
              : `${winners[0].name} wins!`}
            {' '}
            <span style={{ opacity: 0.7 }}>({formatPoints(maxScore)})</span>
          </h2>

          <table className="totals-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Final score</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, i) => (
                <tr key={team.id} className={team.score === maxScore ? 'winner-row' : ''}>
                  <td>{rankFor(sortedTeams, i)}</td>
                  <td>
                    <span
                      className="team-swatch sm"
                      style={{ background: team.color }}
                      aria-hidden
                    />
                    <span style={{ color: team.color }}>{team.name}</span>
                  </td>
                  <td className={team.score < 0 ? 'neg' : ''}>
                    {formatPoints(team.score)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <AddQuestions
            unplayed={unplayed}
            defaultCount={DEFAULT_ADD_COUNT}
            onAdd={(count) => dispatch({ type: 'ADD_MORE_QUESTIONS', count })}
          />

          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'RESET_TO_HOME' })}
            >
              New game (back to Home)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function rankFor(sorted, i) {
  // Dense ranking so ties share a place (1, 1, 3, 4).
  if (i === 0) return 1;
  let rank = 1;
  for (let k = 1; k <= i; k++) {
    if (sorted[k].score !== sorted[k - 1].score) rank = k + 1;
  }
  return rank;
}
