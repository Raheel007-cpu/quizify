import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Modal from '../../components/Modal/Modal';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import QuestionCard from '../../components/QuestionCard/QuestionCard';
import Timer from '../../components/Timer/Timer';
import { useToast } from '../../hooks/useToast';
import {
  getAttemptById,
  saveAttemptAnswer,
  submitQuizAttempt,
} from '../../services/attemptService';
import styles from './QuizAttemptPage.module.css';

function QuizAttemptPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [attemptData, setAttemptData] = useState(
    location.state?.initialData || null
  );
  const [questions, setQuestions] = useState(
    location.state?.initialData?.questions || []
  );
  const [answers, setAnswers] = useState(() => {
    const initial = {};
    for (const q of location.state?.initialData?.questions || []) {
      if (q.selectedAnswer) {
        initial[q.id] = q.selectedAnswer;
      }
    }
    return initial;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(!location.state?.initialData);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submittingRef = useRef(false);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (location.state?.initialData) {
      return;
    }

    let mounted = true;
    const loadAttempt = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getAttemptById(attemptId);
        if (!mounted) return;

        if (res.data.attempt.status !== 'IN_PROGRESS') {
          navigate(`/results/${attemptId}`, { replace: true });
          return;
        }

        const loadedQuestions = res.data.questions || [];
        const initialMap = {};
        for (const q of loadedQuestions) {
          if (q.selectedAnswer) {
            initialMap[q.id] = q.selectedAnswer;
          }
        }

        setAttemptData(res.data);
        setQuestions(loadedQuestions);
        setAnswers(initialMap);
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Unable to load quiz attempt.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAttempt();
    return () => {
      mounted = false;
    };
  }, [attemptId, location.state, navigate]);

  const submitAttempt = useCallback(
    async (isAutoExpire = false) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);

      const formattedAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answersRef.current[q.id] || null,
      }));

      try {
        await submitQuizAttempt(attemptId, formattedAnswers);
        showToast(
          isAutoExpire
            ? 'Time expired! Your quiz was submitted automatically.'
            : 'Quiz submitted successfully!',
          isAutoExpire ? 'info' : 'success'
        );
        navigate(`/results/${attemptId}`, { replace: true });
      } catch (err) {
        submittingRef.current = false;
        setSubmitting(false);
        showToast(err.message || 'Failed to submit quiz.', 'error');
      }
    },
    [attemptId, navigate, questions, showToast]
  );

  const handleAutoExpire = useCallback(() => {
    submitAttempt(true);
  }, [submitAttempt]);

  const handleSelectAnswer = useCallback(
    async (optionKey) => {
      const activeQuestion = questions[currentIndex];
      if (!activeQuestion || submitting || !activeQuestion[`option${optionKey}`]) {
        return;
      }

      setAnswers((prev) => ({
        ...prev,
        [activeQuestion.id]: optionKey,
      }));

      try {
        await saveAttemptAnswer(attemptId, activeQuestion.id, optionKey);
      } catch {
        // Final submission still sends the complete local answers map
      }
    },
    [attemptId, currentIndex, questions, submitting]
  );

  useEffect(() => {
    if (loading || confirmOpen || submitting || questions.length === 0) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (event.key === 'ArrowLeft') {
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (event.key === 'ArrowRight') {
        setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
      } else {
        const keyMap = {
          1: 'A',
          2: 'B',
          3: 'C',
          4: 'D',
          a: 'A',
          b: 'B',
          c: 'C',
          d: 'D',
        };
        const chosen = keyMap[event.key.toLowerCase()];
        if (chosen) {
          handleSelectAnswer(chosen);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmOpen, handleSelectAnswer, loading, questions.length, submitting]);

  const answeredCount = useMemo(
    () => questions.filter((q) => Boolean(answers[q.id])).length,
    [questions, answers]
  );

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <LoadingSpinner label="Loading quiz session..." />
      </div>
    );
  }

  if (error || !attemptData || questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p style={{ marginBottom: '1rem' }}>
          {error || 'Quiz attempt could not be loaded.'}
        </p>
        <Link to="/quizzes" className={styles.backLink}>
          &larr; Browse Quizzes
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div>
          <span className={styles.breadcrumb}>
            {attemptData.quiz?.category?.subject?.name} &bull;{' '}
            {attemptData.quiz?.category?.name}
          </span>
          <h1 className={styles.title}>{attemptData.quiz?.title}</h1>
        </div>

        <div className={styles.topControls}>
          <Timer
            expiresAt={attemptData.attempt?.expiresAt}
            initialRemainingSeconds={attemptData.attempt?.remainingSeconds}
            onExpire={handleAutoExpire}
          />
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </header>

      <ProgressBar
        value={answeredCount}
        max={questions.length}
        label={`${answeredCount} of ${questions.length} answered`}
      />

      <div className={styles.workspace}>
        <div className={styles.questionCol}>
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedAnswer={answers[currentQuestion.id] || null}
            onSelectAnswer={handleSelectAnswer}
            disabled={submitting}
          />

          <div className={styles.navControls}>
            <button
              type="button"
              className={styles.navBtn}
              disabled={currentIndex === 0 || submitting}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              &larr; Previous
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                className={styles.submitBtn}
                disabled={submitting}
                onClick={() => setConfirmOpen(true)}
              >
                Finish &amp; Submit
              </button>
            ) : (
              <button
                type="button"
                className={styles.nextBtn}
                disabled={submitting}
                onClick={() =>
                  setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
                }
              >
                Next &rarr;
              </button>
            )}
          </div>
        </div>

        <aside className={styles.navigatorCard} aria-label="Question navigator">
          <h2 className={styles.navTitle}>Questions</h2>
          <div className={styles.dotGrid}>
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = Boolean(answers[q.id]);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`${styles.dotBtn} ${
                    isCurrent ? styles.dotCurrent : ''
                  } ${isAnswered ? styles.dotAnswered : ''}`}
                  aria-label={`Go to question ${idx + 1}${
                    isAnswered ? ' (answered)' : ' (unanswered)'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className={styles.legend}>
            <span>
              <i className={`${styles.swatch} ${styles.swatchCurrent}`} /> Current
            </span>
            <span>
              <i className={`${styles.swatch} ${styles.swatchAnswered}`} /> Answered
            </span>
          </div>
          <p
            style={{
              marginTop: '0.65rem',
              fontSize: '0.74rem',
              color: 'var(--color-text-muted)',
            }}
          >
            Shortcuts: keys A–D (or 1–4) select an option; &larr;/&rarr; navigate.
          </p>
        </aside>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit Quiz?"
        size="sm"
      >
        <p style={{ marginBottom: '0.75rem' }}>
          You have answered <strong>{answeredCount}</strong> of{' '}
          <strong>{questions.length}</strong> questions.
        </p>
        {unansweredCount > 0 && (
          <p
            style={{
              marginBottom: '1rem',
              color: 'var(--color-warning)',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {unansweredCount} question(s) are still unanswered.
          </p>
        )}
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setConfirmOpen(false)}
          >
            Review Questions
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => submitAttempt(false)}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Confirm Submit'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default QuizAttemptPage;
