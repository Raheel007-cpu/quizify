import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserAttempts } from '../../services/attemptService';
import styles from './DashboardPage.module.css';

function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadSummary = async () => {
      try {
        const res = await getUserAttempts({ limit: 1 });
        if (mounted) {
          setSummary(res.data.summary || null);
        }
      } catch {
        // Non-fatal on dashboard
      }
    };
    loadSummary();
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
            Browse quizzes by subject, track your test history, and inspect
            detailed answer explanations in Reports.
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/quizzes" className={styles.primaryBtn}>
            Browse Quizzes
          </Link>
          <Link to="/reports" className={styles.secondaryBtn}>
            View Reports
          </Link>
          <Link to="/subjects" className={styles.secondaryBtn}>
            Explore Subjects
          </Link>
          <Link to="/profile" className={styles.secondaryBtn}>
            Manage Profile
          </Link>
          {isAdmin && (
            <Link to="/admin" className={styles.secondaryBtn}>
              Admin Dashboard
            </Link>
          )}
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Tests Completed</h2>
          <p className={styles.cardValue}>
            {summary ? summary.totalAttempts : 0}
          </p>
          <p className={styles.cardNote}>
            {summary
              ? `${summary.passedCount} passed, ${summary.failedCount} failed.`
              : 'Start a quiz to record your first attempt.'}
          </p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Average Score</h2>
          <p className={styles.cardValue}>
            {summary ? `${summary.averagePercentage}%` : '0%'}
          </p>
          <p className={styles.cardNote}>
            Best score: {summary ? `${summary.bestPercentage}%` : '0%'} &bull;{' '}
            <Link
              to="/reports"
              style={{ color: 'var(--color-primary)', fontWeight: 600 }}
            >
              Open Reports &rarr;
            </Link>
          </p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Account Role</h2>
          <p className={styles.cardValue}>{user?.role}</p>
          <p className={styles.cardNote}>
            Role-based access control is active across routes and API endpoints.
          </p>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
