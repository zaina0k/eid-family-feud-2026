import { useGame, deltaForRound } from '../../state/gameStore.jsx';
import { formatPoints } from '../shared/format.js';

export default function Transition() {
  const { state, dispatch } = useGame();

  // The transition shows the round we JUST finished — its index is the
  // current `currentRoundIndex` because we haven't advanced yet.
  const justFinishedIdx = state.currentRoundIndex;
  const remaining = state.selectedQuestionIds.length - (justFinishedIdx + 1);

  return (
    <div className="phase phase-transition">
      <div className="transition-card">
        <h2>Round {justFinishedIdx + 1} complete</h2>
        <p className="hint">
          {remaining > 0
            ? `${remaining} question${remaining === 1 ? '' : 's'} remaining.`
            : 'Final round complete.'}
        </p>

        <table className="totals-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>This round</th>
              <th>Running total</th>
            </tr>
          </thead>
          <tbody>
            {state.teams.map((team) => {
              const delta = deltaForRound(state, team.id, justFinishedIdx);
              const total = state.roundTotals[justFinishedIdx]?.[team.id] ?? team.score;
              return (
                <tr key={team.id}>
                  <td>
                    <span
                      className="team-swatch sm"
                      style={{ background: team.color }}
                      aria-hidden
                    />
                    <span style={{ color: team.color }}>{team.name}</span>
                  </td>
                  <td className={delta < 0 ? 'neg' : delta > 0 ? 'pos' : ''}>
                    {delta > 0 ? '+' : ''}
                    {formatPoints(delta)}
                  </td>
                  <td className={total < 0 ? 'neg' : ''}>{formatPoints(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="modal-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={() => dispatch({ type: 'CONTINUE_FROM_TRANSITION' })}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
