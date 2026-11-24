import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ScoreCard from '../../components/ScoreCard/ScoreCard';
import { getAttemptById } from '../../services/attemptService';
import styles from './QuizSubmittedPage.module.css';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

const formatDuration = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}m ${secs}s`;
};

function QuizSubmittedPage() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('ALL');
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
          setError(err.message || 'Could not load quiz report.');
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

  const filteredReview = useMemo(() => {
    const items = data?.review || [];
    if (filter === 'CORRECT') return items.filter((item) => item.isCorrect);
    if (filter === 'INCORRECT') {
      return items.filter((item) => item.selectedAnswer && !item.isCorrect);
    }
    if (filter === 'UNANSWERED') {
      return items.filter((item) => !item.selectedAnswer);
    }
    return items;
  }, [data, filter]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <LoadingSpinner label="Loading quiz report..." />
      </div>
    );
  }

  if (error || !data?.attempt) {
    return (
      <div className={styles.emptyState}>
        <p style={{ marginBottom: '1rem' }}>{error || 'Report not found.'}</p>
        <Link to="/reports" className={styles.primaryBtn}>
          Back to Reports
        </Link>
      </div>
    );
  }

  const { attempt, quiz, review = [] } = data;

  return (
    <div className={styles.page}>
      <div className={styles.topNav}>
        <Link to="/reports" className={styles.backLink}>
          &larr; Back to Reports
        </Link>
      </div>

      <section className={styles.summaryCard}>
        <span
          className={`${styles.statusPill} ${
            attempt.passed ? styles.passed : styles.failed
          }`}
        >
          {attempt.passed ? 'PASSED' : 'FAILED'}
        </span>

        <h1 className={styles.title}>{quiz?.title}</h1>
        <p className={styles.subtitle}>
          {quiz?.category?.subject?.name} &bull; {quiz?.category?.name} &bull;
          Passing score: {quiz?.passingScore}%
          {attempt.completedAt &&
            ` • Completed ${new Date(attempt.completedAt).toLocaleString()}`}
        </p>

        <div className={styles.statsGrid}>
          <ScoreCard
            label="Score"
            value={`${attempt.score} / ${attempt.totalQuestions}`}
            tone="primary"
          />
          <ScoreCard
            label="Percentage"
            value={`${Math.round(attempt.percentage)}%`}
            tone={attempt.passed ? 'success' : 'danger'}
          />
          <ScoreCard
            label="Correct"
            value={attempt.correctAnswers}
            tone="success"
          />
          <ScoreCard
            label="Incorrect"
            value={attempt.incorrectAnswers}
            tone="danger"
          />
          <ScoreCard label="Unanswered" value={attempt.unanswered} />
          <ScoreCard
            label="Time Taken"
            value={formatDuration(attempt.timeTaken)}
          />
        </div>

        <div className={styles.actions}>
          <Link to="/reports" className={styles.secondaryBtn}>
            All Reports
          </Link>
          <Link to={`/quizzes/${quiz?.id}`} className={styles.secondaryBtn}>
            Retake Quiz
          </Link>
          <Link to="/quizzes" className={styles.primaryBtn}>
            Browse More Quizzes
          </Link>
        </div>
      </section>

      <section className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div>
            <h2 className={styles.reviewTitle}>Review Answers</h2>
            <p className={styles.reviewSubtitle}>
              Compare your selected answers against the correct answers and
              explanations.
            </p>
          </div>

          <div className={styles.filterTabs} role="tablist">
            {[
              { key: 'ALL', label: `All (${review.length})` },
              { key: 'CORRECT', label: `Correct (${attempt.correctAnswers})` },
              {
                key: 'INCORRECT',
                label: `Incorrect (${attempt.incorrectAnswers})`,
              },
              {
                key: 'UNANSWERED',
                label: `Unanswered (${attempt.unanswered})`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={filter === tab.key}
                onClick={() => setFilter(tab.key)}
                className={`${styles.tabBtn} ${
                  filter === tab.key ? styles.tabActive : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredReview.length === 0 ? (
          <div className={styles.emptyState}>
            No questions in this filter category.
          </div>
        ) : (
          <div className={styles.reviewList}>
            {filteredReview.map((item) => {
              const isUnanswered = !item.selectedAnswer;
              const badgeClass = item.isCorrect
                ? styles.badgeCorrect
                : isUnanswered
                ? styles.badgeUnanswered
                : styles.badgeIncorrect;

              const statusText = item.isCorrect
                ? '✓ Correct'
                : isUnanswered
                ? '— Unanswered'
                : '✗ Incorrect';

              return (
                <article key={item.questionId} className={styles.questionCard}>
                  <div className={styles.qHeader}>
                    <span className={styles.qNumber}>
                      Question {item.questionOrder}
                    </span>
                    <span className={`${styles.qStatus} ${badgeClass}`}>
                      {statusText}
                    </span>
                  </div>

                  <h3 className={styles.qPrompt}>{item.questionText}</h3>

                  <div className={styles.optionsList}>
                    {OPTION_KEYS.map((key) => {
                      const text = item[`option${key}`];
                      const isCorrectOption = item.correctAnswer === key;
                      const isUserSelected = item.selectedAnswer === key;

                      let optionClass = styles.optionRow;
                      if (isCorrectOption) {
                        optionClass = `${styles.optionRow} ${styles.optionCorrect}`;
                      } else if (isUserSelected && !item.isCorrect) {
                        optionClass = `${styles.optionRow} ${styles.optionWrong}`;
                      }

                      return (
                        <div key={key} className={optionClass}>
                          <span className={styles.optKey}>{key}</span>
                          <span className={styles.optText}>{text}</span>
                          <div className={styles.optTags}>
                            {isUserSelected && (
                              <span className={styles.yourPickTag}>
                                Your Answer
                              </span>
                            )}
                            {isCorrectOption && (
                              <span className={styles.correctPickTag}>
                                Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {item.explanation && (
                    <div className={styles.explanationBox}>
                      <strong>Explanation:</strong> {item.explanation}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default QuizSubmittedPage;
