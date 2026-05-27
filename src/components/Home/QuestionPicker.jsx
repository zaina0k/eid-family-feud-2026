export default function QuestionPicker({ questions, selectedIds, onToggle }) {
  const selectedSet = new Set(selectedIds);
  return (
    <ul className="question-list">
      {questions.map((q) => {
        const checked = selectedSet.has(q.id);
        // Selection order index — shown next to the prompt so the host
        // can see the play order.
        const orderIdx = checked ? selectedIds.indexOf(q.id) + 1 : null;
        return (
          <li key={q.id} className={'question-row' + (checked ? ' checked' : '')}>
            <label>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(q.id)}
              />
              <span className="question-order">
                {orderIdx ? `#${orderIdx}` : '  '}
              </span>
              <span className="question-text">{q.prompt}</span>
              <span className="answer-count">{q.answers.length} answers</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
