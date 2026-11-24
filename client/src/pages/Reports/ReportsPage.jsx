import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Pagination from '../../components/Pagination/Pagination';
import ScoreCard from '../../components/ScoreCard/ScoreCard';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useToast } from '../../hooks/useToast';
import { getUserAttempts } from '../../services/attemptService';
import { getSubjects } from '../../services/subjectService';
import styles from './ReportsPage.module.css';

const RESULT_OPTIONS = [
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
];

const formatDuration = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}m ${secs}s`;
};

function ReportsPage() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [subjects, setSubjects] = useState([]);

  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await getSubjects();
        setSubjects(res.data.subjects || []);
      } catch {
        // Non-fatal; table still works without subject dropdown
      }
    };
    loadSubjects();
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserAttempts({
        page,
        limit: 10,
        ...(search ? { search } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(resultFilter ? { result: resultFilter } : {}),
      });
      setSummary(res.data.summary || null);
      setAttempts(res.data.attempts || []);
      setPagination(
        res.data.pagination || { page: 1, totalPages: 1, total: 0 }
      );
    } catch (err) {
      showToast(err.message || 'Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, subjectId, resultFilter, showToast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports &amp; Test History</h1>
          <p className={styles.subtitle}>
            Review your quiz attempts, scores, pass/fail outcomes, and
            question-by-question explanations.
          </p>
        </div>
        <Link to="/quizzes" className={styles.primaryBtn}>
          Take a Quiz
        </Link>
      </div>

      {summary && (
        <section className={styles.statsGrid} aria-label="Performance summary">
          <ScoreCard
            label="Tests Taken"
            value={summary.totalAttempts}
            tone="primary"
            subtext={`${summary.passedCount} passed, ${summary.failedCount} failed`}
          />
          <ScoreCard
            label="Average Score"
            value={`${summary.averagePercentage}%`}
            tone={summary.averagePercentage >= 60 ? 'success' : 'default'}
          />
          <ScoreCard
            label="Best Score"
            value={`${summary.bestPercentage}%`}
            tone="success"
          />
          <ScoreCard
            label="Answer Accuracy"
            value={`${summary.accuracyPercentage}%`}
            subtext={`${summary.totalCorrectAnswers} / ${summary.totalQuestionsAnswered} answered`}
          />
        </section>
      )}

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by quiz title..."
            ariaLabel="Search test history"
          />
          <FilterDropdown
            label="Subject"
            value={subjectId}
            onChange={(val) => {
              setSubjectId(val);
              setPage(1);
            }}
            allLabel="All Subjects"
            options={subjects.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))}
          />
          <FilterDropdown
            label="Result"
            value={resultFilter}
            onChange={(val) => {
              setResultFilter(val);
              setPage(1);
            }}
            allLabel="All Results"
            options={RESULT_OPTIONS}
          />
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <LoadingSpinner label="Loading your test reports..." />
          </div>
        ) : attempts.length === 0 ? (
          <div className={styles.emptyState}>
            <p style={{ marginBottom: '1rem' }}>
              {summary?.totalAttempts === 0
                ? 'You have not completed any quizzes yet.'
                : 'No quiz attempts match your current filters.'}
            </p>
            <Link to="/quizzes" className={styles.primaryBtn}>
              Browse Available Quizzes
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Result</th>
                    <th>Time Taken</th>
                    <th>Date</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>
                        <strong>{attempt.quiz?.title}</strong>
                        <div className={styles.metaText}>
                          {attempt.quiz?.category?.subject?.name} &bull;{' '}
                          {attempt.quiz?.category?.name}
                        </div>
                      </td>
                      <td>
                        {attempt.score} / {attempt.totalQuestions}
                      </td>
                      <td>
                        <strong>{Math.round(attempt.percentage)}%</strong>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            attempt.passed ? styles.badgePass : styles.badgeFail
                          }`}
                        >
                          {attempt.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td>{formatDuration(attempt.timeTaken)}</td>
                      <td>
                        {attempt.completedAt
                          ? new Date(attempt.completedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td>
                        <Link
                          to={`/results/${attempt.id}`}
                          className={styles.viewBtn}
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}

export default ReportsPage;
