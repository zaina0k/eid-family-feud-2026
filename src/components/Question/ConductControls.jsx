export default function ConductControls({ teams, onAdjust }) {
  // One dedicated +10/-10 pair per team. Independent of the pot. Scores
  // may go negative — no clamp here. The team name+colour on the group
  // removes any ambiguity about which team is being adjusted.
  return (
    <div className="conduct-row">
      <div className="conduct-label">Host conduct (reward / penalty):</div>
      <div className="conduct-grid">
        {teams.map((team) => (
          <div
            key={team.id}
            className="conduct-team"
            style={{ borderColor: team.color }}
          >
            <span className="conduct-team-name" style={{ color: team.color }}>
              {team.name}
            </span>
            <div className="conduct-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => onAdjust(team.id, +10)}
                title={`Reward ${team.name}: +10`}
              >
                +10
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onAdjust(team.id, -10)}
                title={`Penalize ${team.name}: −10 (may go negative)`}
              >
                −10
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
