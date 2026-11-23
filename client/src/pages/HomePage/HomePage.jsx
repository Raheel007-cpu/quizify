import { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { getHealthStatus } from '../../services/healthService';
import styles from './HomePage.module.css';

function HomePage() {
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
        <span className={styles.eyebrow}>Phase 1 &mdash; Foundation Setup</span>
        <h1 className={styles.title}>
          Interactive Quizzes, Instant Feedback, Measurable Mastery.
        </h1>
        <p className={styles.subtitle}>
          Welcome to Quizify. The full-stack foundation is wired with React,
          Vite, Express, Prisma ORM, and PostgreSQL.
        </p>
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
