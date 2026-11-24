import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { getHealthStatus } from '../../services/healthService';
import styles from './HomePage.module.css';

function HomePage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  const checkConnectivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHealth(null);

    try {
      const payload = await getHealthStatus();
      setHealth(payload.data);
    } catch (err) {
      setError(err);
      if (err.data?.data) {
        setHealth(err.data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnectivity();
  }, [checkConnectivity]);

  const apiConnected = Boolean(health);
  const dbConnected = Boolean(health?.database?.connected);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Quizify Platform</span>
        <h1 className={styles.title}>
          Interactive Quizzes, Instant Feedback, Measurable Mastery.
        </h1>
        <p className={styles.subtitle}>
          Register, sign in, and master topics through timed MCQ challenges,
          instant answer reviews, and analytics.
        </p>
        <div className={styles.heroActions}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={styles.primaryCta}>
                Go to Dashboard
              </Link>
              <Link to="/quizzes" className={styles.secondaryCta}>
                Browse Quizzes
              </Link>
              {isAdmin && (
                <Link to="/admin" className={styles.secondaryCta}>
                  Admin Console
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/register" className={styles.primaryCta}>
                Get Started
              </Link>
              <Link to="/login" className={styles.secondaryCta}>
                Sign In
              </Link>
              <Link to="/quizzes" className={styles.secondaryCta}>
                Explore Quizzes
              </Link>
            </>
          )}
        </div>
      </section>

      <section className={styles.featuresGrid} aria-label="Platform highlights">
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>01</span>
          <h2 className={styles.featureTitle}>Randomized Timed Quizzes</h2>
          <p className={styles.featureDesc}>
            Every attempt draws a fresh question set from the bank with a
            server-verified countdown timer.
          </p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>02</span>
          <h2 className={styles.featureTitle}>Instant Answer Review</h2>
          <p className={styles.featureDesc}>
            Receive immediate scores, pass/fail status, and detailed
            explanations inside your Reports.
          </p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>03</span>
          <h2 className={styles.featureTitle}>Analytics &amp; Leaderboard</h2>
          <p className={styles.featureDesc}>
            Visualize score trends across subjects and difficulties and compete
            on the Quizify leaderboard.
          </p>
        </div>
      </section>

      <section className={styles.statusCard} aria-live="polite">
        <div className={styles.statusHeader}>
          <div>
            <h2 className={styles.statusTitle}>System Connectivity Check</h2>
            <p className={styles.statusDesc}>
              Verifies live communication: React Frontend &rarr; Express REST
              API &rarr; PostgreSQL Database
            </p>
          </div>
          <button
            type="button"
            className={styles.retryButton}
            onClick={checkConnectivity}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Re-check Connection'}
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <LoadingSpinner label="Pinging Express API and PostgreSQL via Prisma..." />
          </div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Frontend (React + Vite)</span>
              <span className={`${styles.badge} ${styles.badgeOk}`}>
                Active
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Backend (Express API)</span>
              <span
                className={`${styles.badge} ${
                  apiConnected ? styles.badgeOk : styles.badgeFail
                }`}
              >
                {apiConnected ? 'Connected' : 'Unreachable'}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>
                Database (PostgreSQL + Prisma)
              </span>
              <span
                className={`${styles.badge} ${
                  dbConnected ? styles.badgeOk : styles.badgeFail
                }`}
              >
                {dbConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        )}

        {!loading && health && (
          <div className={styles.details}>
            <div>
              <strong>Environment:</strong> {health.environment}
            </div>
            <div>
              <strong>Service:</strong> {health.service}
            </div>
            {health.database?.latencyMs !== null && (
              <div>
                <strong>DB Latency:</strong> {health.database.latencyMs} ms
              </div>
            )}
            <div>
              <strong>Checked At:</strong>{' '}
              {new Date(health.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className={styles.errorBox} role="alert">
            <strong>Connection Detail:</strong> {error.message}
            {health?.database?.error && (
              <p className={styles.errorSubtext}>{health.database.error}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
