import { useEffect, useState } from 'react';

export default function Drumroll({ onDone }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 280);
    const finish = setTimeout(() => {
      clearInterval(interval);
      onDone();
    }, 2400);
    return () => {
      clearInterval(interval);
      clearTimeout(finish);
    };
  }, [onDone]);

  const dots = '.'.repeat((tick % 4) + 1);
  return (
    <div className="drumroll">
      <div className="drumroll-text">Drumroll{dots}</div>
      <div className="drumroll-bar">
        <div className="drumroll-fill" />
      </div>
      <button
        className="btn btn-ghost btn-small"
        onClick={onDone}
        style={{ marginTop: 16 }}
      >
        Skip
      </button>
    </div>
  );
}
