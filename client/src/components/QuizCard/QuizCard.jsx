import { Link } from 'react-router-dom';
import styles from './QuizCard.module.css';

const DIFFICULTY_CLASSES = {
  EASY: styles.badgeEasy,
  MEDIUM: styles.badgeMedium,
  HARD: styles.badgeHard,
};

function QuizCard({ quiz }) {
  const subjectName = quiz.category?.subject?.name;
  const categoryName = quiz.category?.name;

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <span className={styles.breadcrumb}>
          {subjectName ? `${subjectName} / ` : ''}
          {categoryName}
        </span>
        <span
          className={`${styles.badge} ${
            DIFFICULTY_CLASSES[quiz.difficulty] || ''
          }`}
        >
          {quiz.difficulty}
        </span>
      </div>

      <h3 className={styles.title}>{quiz.title}</h3>
      <p className={styles.description}>
        {quiz.description || 'Test your knowledge with timed MCQ questions.'}
      </p>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Questions</span>
          <strong>{quiz.questionCount}</strong>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Time Limit</span>
          <strong>{quiz.timeLimit} min</strong>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Pass Score</span>
          <strong>{quiz.passingScore}%</strong>
        </div>
      </div>

      <div className={styles.actions}>
        <Link to={`/quizzes/${quiz.id}`} className={styles.detailsLink}>
          View Details
        </Link>
        <Link to={`/quiz/${quiz.id}/start`} className={styles.startBtn}>
          Start Quiz
        </Link>
      </div>
    </article>
  );
}

export default QuizCard;
