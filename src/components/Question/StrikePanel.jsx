import { MAX_STRIKES } from '../../config.js';

export default function StrikePanel({ strikes, onInc, onDec, onReset }) {
  return (
    <div className="strike-panel">
      <div className="strike-icons" aria-label={`${strikes} of ${MAX_STRIKES} strikes`}>
        {Array.from({ length: MAX_STRIKES }).map((_, i) => (
          <span
            key={i}
            className={'strike-icon' + (i < strikes ? ' active' : '')}
            aria-hidden
          >
            ✗
          </span>
        ))}
      </div>
      <div className="strike-controls">
        <button
          className="btn btn-danger"
          onClick={onInc}
          disabled={strikes >= MAX_STRIKES}
        >
          + Strike
        </button>
        <button
          className="btn btn-secondary btn-small"
          onClick={onDec}
          disabled={strikes <= 0}
        >
          − Undo
        </button>
        <button
          className="btn btn-secondary btn-small"
          onClick={onReset}
          disabled={strikes === 0}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
