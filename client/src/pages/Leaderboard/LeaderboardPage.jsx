import { useCallback, useEffect, useMemo, useState } from 'react';
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown';
import Leaderboard from '../../components/Leaderboard/Leaderboard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { getLeaderboard } from '../../services/leaderboardService';
import { getQuizzes } from '../../services/quizService';
import { getSubjects } from '../../services/subjectService';
import styles from './LeaderboardPage.module.css';

function LeaderboardPage() {
  const { showToast } = useToast();
  const [rankings, setRankings] = useState([]);
  const [scoringRules, setScoringRules] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [subjectId, setSubjectId] = useState('');
  const [quizId, setQuizId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [subRes, quizRes] = await Promise.all([
          getSubjects(),
          getQuizzes({ limit: 100 }),
        ]);
        setSubjects(subRes.data.subjects || []);
        setQuizzes(quizRes.data.quizzes || []);
      } catch {
        // Non-fatal
      }
    };
    loadFilters();
  }, []);

  const filteredQuizzes = useMemo(() => {
    if (!subjectId) return quizzes;
    return quizzes.filter(
      (q) => String(q.category?.subject?.id) === subjectId
    );
  }, [quizzes, subjectId]);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeaderboard({
        ...(subjectId ? { subjectId } : {}),
        ...(quizId ? { quizId } : {}),
      });
      setRankings(res.data.rankings || []);
      setScoringRules(res.data.scoringRules || null);
    } catch (err) {
      showToast(err.message || 'Failed to load leaderboard.', 'error');
    } finally {
      setLoading(false);
    }
  }, [subjectId, quizId, showToast]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>
            Top learners ranked by mastery across overall quizzes, subjects, or
            individual quizzes.
          </p>
        </div>
      </div>

      {scoringRules && (
        <section className={styles.rulesBanner}>
          <strong>How Points Are Calculated:</strong>{' '}
          {scoringRules.pointsPerCorrect} pts per correct answer &times;
          difficulty multiplier (Easy 1.0&times;, Medium 1.25&times;, Hard
          1.5&times;) + {scoringRules.passBonusPoints} bonus pts on passing.{' '}
          <span className={styles.rulesNote}>({scoringRules.aggregation}.)</span>
        </section>
      )}

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <FilterDropdown
            label="Subject"
            value={subjectId}
            onChange={(val) => {
              setSubjectId(val);
              setQuizId('');
            }}
            allLabel="Overall (All Subjects)"
            options={subjects.map((s) => ({
              value: String(s.id),
              label: s.name,
            }))}
          />
          <FilterDropdown
            label="Quiz"
            value={quizId}
            onChange={setQuizId}
            allLabel="All Quizzes"
            options={filteredQuizzes.map((q) => ({
              value: String(q.id),
              label: q.title,
            }))}
          />
          {(subjectId || quizId) && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setSubjectId('');
                setQuizId('');
              }}
            >
              Show Overall
            </button>
          )}
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <LoadingSpinner label="Loading leaderboard..." />
          </div>
        ) : (
          <Leaderboard
            rankings={rankings}
            emptyMessage="No completed quiz attempts match this filter yet."
          />
        )}
      </section>
    </div>
  );
}

export default LeaderboardPage;
