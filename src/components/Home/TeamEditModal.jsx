import { useState } from 'react';
import Modal from '../shared/Modal.jsx';
import { DEFAULT_COLORS } from '../../config.js';

export default function TeamEditModal({ team, otherTeams, onClose, onSave }) {
  const [name, setName] = useState(team.name);
  const [color, setColor] = useState(team.color);

  const usedColors = new Set(otherTeams.map((t) => t.color.toLowerCase()));
  const collides = usedColors.has(color.toLowerCase());
  const nameTrimmed = name.trim();
  const canSave = nameTrimmed.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: nameTrimmed, color });
  };

  return (
    <Modal title={`Edit ${team.name}`} onClose={onClose}>
      <div className="form-row">
        <label htmlFor="team-name">Name</label>
        <input
          id="team-name"
          type="text"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label>Colour</label>
        <div className="color-row">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={
                'color-swatch' + (c.toLowerCase() === color.toLowerCase() ? ' selected' : '')
              }
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Choose colour ${c}`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Custom colour"
          />
        </div>
        {collides && (
          <div className="warn">
            Another team is using this colour. You can save anyway, but they
            will look the same.
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
          Save
        </button>
      </div>
    </Modal>
  );
}
