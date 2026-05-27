import { useState } from 'react';

export default function AddQuestions({ unplayed, defaultCount, onAdd }) {
  const [count, setCount] = useState(defaultCount);
  const [notice, setNotice] = useState('');

  if (unplayed === 0) {
    return (
      <div className="add-questions">
        <p className="hint">No unplayed questions left in the pool.</p>
      </div>
    );
  }

  const requestedCount = Math.max(1, count);
  const actualCount = Math.min(requestedCount, unplayed);
  const willHitPoolCap = requestedCount > unplayed;

  const handleAdd = () => {
    if (willHitPoolCap) {
      setNotice(
        `Pool only has ${unplayed} unplayed question${unplayed === 1 ? '' : 's'}; added ${actualCount}.`
      );
    }
    onAdd(actualCount);
  };

  return (
    <div className="add-questions">
      <h3>Add more questions</h3>
      <p className="hint">
        {unplayed} unplayed question{unplayed === 1 ? '' : 's'} available in the pool.
      </p>
      <div className="form-row inline">
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          disabled={requestedCount <= 1}
        >
          −
        </button>
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10);
            setCount(Number.isNaN(v) ? 1 : Math.max(1, v));
          }}
          style={{ width: 80, textAlign: 'center' }}
        />
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setCount((c) => c + 1)}
        >
          +
        </button>
        <button className="btn btn-primary" onClick={handleAdd}>
          Add {actualCount} & play
        </button>
      </div>
      {notice && <div className="warn">{notice}</div>}
    </div>
  );
}
