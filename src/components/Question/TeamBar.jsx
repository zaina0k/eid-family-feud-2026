import { formatPoints } from '../shared/format.js';
import { textOn } from '../shared/contrast.js';

export default function TeamBar({ teams, activeTeamId, onPick, locked }) {
  return (
    <div className="team-bar">
      {teams.map((team) => {
        const active = team.id === activeTeamId;
        const fg = active ? textOn(team.color) : team.color;
        return (
          <button
            key={team.id}
            type="button"
            className={'team-btn' + (active ? ' active' : '')}
            style={{
              background: active ? team.color : 'rgba(0,0,0,0.45)',
              borderColor: team.color,
              color: fg,
            }}
            onClick={() => onPick(team.id)}
            disabled={locked}
            title={
              locked
                ? 'Pot already collected — locked for this round.'
                : active
                ? `${team.name} is currently active`
                : `Set ${team.name} as the active team`
            }
          >
            <span className="team-btn-name">
              {active && <span className="team-btn-marker">●</span>}
              {team.name}
            </span>
            <span className="team-btn-score">{formatPoints(team.score)}</span>
          </button>
        );
      })}
    </div>
  );
}
