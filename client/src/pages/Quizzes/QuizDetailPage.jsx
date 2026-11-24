import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { startQuizAttempt } from '../../services/attemptService';
import { getQuizById } from '../../services/quizService';
import styles from './QuizDetailPage.module.css';

function QuizDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadQuiz = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getQuizById(id);
        if (mounted) {
          setQuiz(res.data.quiz);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Quiz not found.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadQuiz();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleStartQuiz = async () => {
    setStarting(true);
    try {
      const res = await startQuizAttempt(Number(id));
      const { attempt, resumed } = res.data;
      if (resumed) {
        showToast('Resumed your active quiz attempt.', 'info');
      }
      navigate(`/quiz/${attempt.id}`, { state: { initialData: res.data } });
    } catch (err) {
      showToast(err.message || 'Unable to start quiz.', 'error');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <LoadingSpinner label="Loading quiz details..." />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className={styles.emptyState}>
        <p style={{ marginBottom: '1rem' }}>{error || 'Quiz not found.'}</p>
        <Link to="/quizzes" className={styles.backLink}>
          &larr; Back to Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/quizzes" className={styles.backLink}>
        &larr; Back to Quizzes
      </Link>

      <section className={styles.card}>
        <div className={styles.topMeta}>
          <span className={styles.breadcrumb}>
            {quiz.category?.subject?.name} &rarr; {quiz.category?.name}
          </span>
          <span className={styles.diffBadge}>{quiz.difficulty}</span>
        </div>

        <h1 className={styles.title}>{quiz.title}</h1>
        <p className={styles.description}>
          {quiz.description ||
            'Answer randomized multiple-choice questions within the time limit.'}
        </p>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Questions</span>
            <strong className={styles.statValue}>{quiz.questionCount}</strong>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Time Limit</span>
            <strong className={styles.statValue}>{quiz.timeLimit} min</strong>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Passing Score</span>
            <strong className={styles.statValue}>{quiz.passingScore}%</strong>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Question Order</span>
            <strong className={styles.statValue}>Randomized</strong>
          </div>
        </div>

        <div className={styles.instructions}>
          <h2 className={styles.instructionsTitle}>Before you begin</h2>
          <ul>
            <li>
              Questions are randomly selected from the question bank for each
              attempt.
            </li>
            <li>
              You can navigate freely between questions and update your choices
              before submitting.
            </li>
            <li>
              The countdown timer starts immediately and auto-submits when it
              reaches <code>00:00</code>.
            </li>
          </ul>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleStartQuiz}
            disabled={starting}
            className={styles.startBtn}
          >
            {starting ? 'Preparing Questions...' : 'Start Quiz'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default QuizDetailPage;
