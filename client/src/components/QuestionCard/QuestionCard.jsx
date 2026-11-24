import styles from './QuestionCard.module.css';

const OPTIONS = [
  { key: 'A', field: 'optionA' },
  { key: 'B', field: 'optionB' },
  { key: 'C', field: 'optionC' },
  { key: 'D', field: 'optionD' },
];

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}) {
  return (
    <section className={styles.card}>
      <div className={styles.counter}>
        Question {questionNumber} of {totalQuestions}
      </div>

      <h2 className={styles.prompt}>{question.questionText}</h2>

      <div className={styles.options} role="radiogroup" aria-label="Answer options">
        {OPTIONS.map(({ key, field }) => {
          const isSelected = selectedAnswer === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelectAnswer(key)}
              className={`${styles.optionBtn} ${
                isSelected ? styles.optionSelected : ''
              }`}
            >
              <span className={styles.optionLetter}>{key}</span>
              <span className={styles.optionText}>{question[field]}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default QuestionCard;
