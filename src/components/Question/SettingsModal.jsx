import { useState } from 'react';
import Modal from '../shared/Modal.jsx';
import { useGame } from '../../state/gameStore.jsx';
import { SETTINGS_PASSWORD, DEFAULT_COLORS } from '../../config.js';
import { formatPoints } from '../shared/format.js';

export default function SettingsModal({ onClose }) {
  const { state, dispatch } = useGame();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState('');

  if (!unlocked) {
    return (
      <Modal title="Settings — locked" onClose={onClose}>
        <p className="hint">
          Enter the host password. (This is a speed bump, not real security.)
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pw === SETTINGS_PASSWORD) {
              setUnlocked(true);
              setPwError('');
            } else {
              setPwError('Wrong password.');
            }
          }}
        >
          <div className="form-row">
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
            />
          </div>
          {pwError && <div className="warn">{pwError}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Unlock
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal title="Settings — host" onClose={onClose}>
      <p className="hint">
        Changes here adjust team data directly. Pot and any prior round
        snapshots are NOT modified — those stay frozen so round-by-round
        deltas remain consistent with what actually happened.
      </p>

      <div className="settings-teams">
        {state.teams.map((team) => (
          <TeamSettingsRow key={team.id} team={team} dispatch={dispatch} />
        ))}
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

function TeamSettingsRow({ team, dispatch }) {
  const [name, setName] = useState(team.name);
  const [color, setColor] = useState(team.color);
  const [scoreStr, setScoreStr] = useState(String(team.score));

  const parsedScore = Number.parseInt(scoreStr, 10);
  const scoreValid = !Number.isNaN(parsedScore);

  return (
    <div className="settings-team" style={{ borderColor: team.color }}>
      <div className="settings-team-head" style={{ color: team.color }}>
        {team.name} — current score {formatPoints(team.score)}
      </div>

      <div className="form-row">
        <label>Name</label>
        <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        <button
          className="btn btn-secondary btn-small"
          onClick={() =>
            dispatch({ type: 'UPDATE_TEAM', teamId: team.id, patch: { name: name.trim() || team.name } })
          }
        >
          Save name
        </button>
      </div>

      <div className="form-row">
        <label>Colour</label>
        <div className="color-row">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={'color-swatch' + (c.toLowerCase() === color.toLowerCase() ? ' selected' : '')}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <button
            className="btn btn-secondary btn-small"
            onClick={() => dispatch({ type: 'UPDATE_TEAM', teamId: team.id, patch: { color } })}
          >
            Save colour
          </button>
        </div>
      </div>

      <div className="form-row">
        <label>Score</label>
        <input
          type="number"
          value={scoreStr}
          onChange={(e) => setScoreStr(e.target.value)}
          // No min — negative scores are allowed per the blueprint.
        />
        <button
          className="btn btn-secondary btn-small"
          disabled={!scoreValid}
          onClick={() =>
            dispatch({ type: 'SETTINGS_SET_SCORE', teamId: team.id, value: parsedScore })
          }
        >
          Set score
        </button>
      </div>
    </div>
  );
}
