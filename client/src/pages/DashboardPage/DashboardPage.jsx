import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ScoreCard from '../../components/ScoreCard/ScoreCard';
import { useAuth } from '../../hooks/useAuth';
import { getUserAttempts } from '../../services/attemptService';
import styles from './DashboardPage.module.css';

function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        const res = await getUserAttempts({ limit: 5 });
        if (!mounted) return;
        setSummary(res.data.summary || null);
        setRecentAttempts(res.data.attempts || []);
      } catch {
        // Keep dashboard graceful if stats fail
      }
    };
    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.welcomeCard}>
        <div>
          <span className={styles.badge}>Student Workspace</span>
          <h1 className={styles.title}>Welcome back, {user?.name}</h1>
          <p className={styles.subtitle}>
            Browse quizzes by subject, review your test history in Reports, and
            climb the leaderboard.
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/quizzes" className={styles.primaryBtn}>
            Browse Quizzes
          </Link>
          <Link to="/reports" className={styles.secondaryBtn}>
            Reports
          </Link>
          <Link to="/leaderboard" className={styles.secondaryBtn}>
            Leaderboard
          </Link>
          <Link to="/subjects" className={styles.secondaryBtn}>
            Subjects
          </Link>
          {isAdmin && (
            <Link to="/admin" className={styles.secondaryBtn}>
              Admin Console
            </Link>
          )}
        </div>
      </section>

      <section className={styles.statsGrid}>
        <ScoreCard
          label="Tests Taken"
          value={summary?.totalAttempts ?? 0}
          tone="primary"
        />
        <ScoreCard
          label="Tests Passed"
          value={summary?.passedCount ?? 0}
          tone="success"
        />
        <ScoreCard
          label="Average Score"
          value={`${summary?.averagePercentage ?? 0}%`}
        />
        <ScoreCard
          label="Best Score"
          value={`${summary?.bestPercentage ?? 0}%`}
          tone="success"
        />
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Recent Attempts</h2>
          <Link to="/reports" className={styles.viewAllLink}>
            View all reports &rarr;
          </Link>
        </div>
        {recentAttempts.length === 0 ? (
          <p className={styles.cardNote}>
            No completed quizzes yet. Start one from{' '}
            <Link to="/quizzes" className={styles.viewAllLink}>
              Quizzes
            </Link>
            .
          </p>
        ) : (
          <ul className={styles.recentList}>
            {recentAttempts.map((a) => (
              <li key={a.id} className={styles.recentItem}>
                <div>
                  <Link
                    to={`/results/${a.id}`}
                    className={styles.recentTitle}
                  >
                    {a.quiz?.title}
                  </Link>
                  <div className={styles.recentMeta}>
                    {a.score}/{a.totalQuestions} &bull;{' '}
                    {Math.round(a.percentage)}%
                  </div>
                </div>
                <span
                  className={`${styles.resultBadge} ${
                    a.passed ? styles.passBadge : styles.failBadge
                  }`}
                >
                  {a.passed ? 'Passed' : 'Failed'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
