import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { getAttemptById } from '../../services/attemptService';
import styles from './QuizSubmittedPage.module.css';

const formatDuration = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}m ${secs}s`;
};

function QuizSubmittedPage() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadResult = async () => {
      setLoading(true);
      try {
        const res = await getAttemptById(attemptId);
        if (mounted) {
          setData(res.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Could not load quiz result.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadResult();
    return () => {
      mounted = false;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <LoadingSpinner label="Loading quiz summary..." />
      </div>
    );
  }

  if (error || !data?.attempt) {
    return (
      <div className={styles.emptyState}>
        <p style={{ marginBottom: '1rem' }}>
          {error || 'Result not found.'}
        </p>
        <Link to="/quizzes" className={styles.primaryBtn}>
          Browse Quizzes
        </Link>
      </div>
    );
  }

  const { attempt, quiz } = data;

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <span
          className={`${styles.statusPill} ${
            attempt.passed ? styles.passed : styles.failed
          }`}
        >
          {attempt.passed ? 'PASSED' : 'FAILED'}
        </span>

        <h1 className={styles.title}>{quiz?.title}</h1>
        <p className={styles.subtitle}>
          Quiz completed! Detailed answer review and full attempt history arrive
          in Phase 5.
        </p>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span>Score</span>
            <strong>
              {attempt.score} / {attempt.totalQuestions}
            </strong>
          </div>
          <div className={styles.statBox}>
            <span>Percentage</span>
            <strong>{Math.round(attempt.percentage)}%</strong>
          </div>
          <div className={styles.statBox}>
            <span>Correct</span>
            <strong>{attempt.correctAnswers}</strong>
          </div>
          <div className={styles.statBox}>
            <span>Incorrect</span>
            <strong>{attempt.incorrectAnswers}</strong>
          </div>
          <div className={styles.statBox}>
            <span>Unanswered</span>
            <strong>{attempt.unanswered}</strong>
          </div>
          <div className={styles.statBox}>
            <span>Time Taken</span>
            <strong>{formatDuration(attempt.timeTaken)}</strong>
          </div>
        </div>

        <div className={styles.actions}>
          <Link to={`/quizzes/${quiz?.id}`} className={styles.secondaryBtn}>
            Retake Quiz
          </Link>
          <Link to="/quizzes" className={styles.primaryBtn}>
            Browse More Quizzes
          </Link>
        </div>
      </section>
    </div>
  );
}

export default QuizSubmittedPage;
