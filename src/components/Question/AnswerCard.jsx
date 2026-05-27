export default function AnswerCard({ index, answer, revealed, onToggle, locked }) {
  return (
    <button
      type="button"
      className={
        'answer-card' + (revealed ? ' revealed' : '') + (locked ? ' locked' : '')
      }
      onClick={onToggle}
      title={
        locked
          ? 'Pot locked — pot will not change.'
          : revealed
          ? `Hide (removes ${answer.points} from pot)`
          : `Reveal (adds ${answer.points} to pot)`
      }
    >
      <span className="answer-slot-num">{index + 1}</span>
      {revealed ? (
        <>
          <span className="answer-text">{answer.text}</span>
          <span className="answer-points">{answer.points}</span>
        </>
      ) : (
        <span className="answer-hidden">— hidden —</span>
      )}
    </button>
  );
}
