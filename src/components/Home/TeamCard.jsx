export default function TeamCard({ team, canRemove, onEdit, onRemove }) {
  return (
    <div
      className="team-card"
      style={{ borderColor: team.color, boxShadow: `0 0 0 2px ${team.color} inset` }}
    >
      <div className="team-card-row">
        <span
          className="team-swatch"
          style={{ background: team.color }}
          aria-hidden
        />
        <span className="team-name">{team.name}</span>
      </div>
      <div className="team-card-actions">
        <button className="btn btn-secondary btn-small" onClick={onEdit}>
          Edit
        </button>
        <button
          className="btn btn-danger btn-small"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? 'Remove team' : 'Minimum number of teams reached'}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
