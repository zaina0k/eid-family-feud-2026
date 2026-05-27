import AnswerCard from './AnswerCard.jsx';

export default function AnswerBoard({ answers, revealed, onToggle, locked }) {
  // Two columns when there are >= 5 answers, otherwise one. Lays out cleanly
  // for both the 4-answer and 8-answer questions.
  const cols = answers.length >= 5 ? 2 : 1;
  return (
    <div className={'answer-board cols-' + cols}>
      {answers.map((a, i) => (
        <AnswerCard
          key={i}
          index={i}
          answer={a}
          revealed={!!revealed[i]}
          onToggle={() => onToggle(i)}
          locked={locked}
        />
      ))}
    </div>
  );
}
