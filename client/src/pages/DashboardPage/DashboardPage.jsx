import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './DashboardPage.module.css';

function DashboardPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className={styles.page}>
      <section className={styles.welcomeCard}>
        <div>
          <span className={styles.badge}>Student Workspace</span>
          <h1 className={styles.title}>Welcome back, {user?.name}</h1>
          <p className={styles.subtitle}>
            Your session is authenticated via HTTP-only JWT cookie. Browse
            quizzes, track attempt history, and analyze performance as upcoming
            phases unlock.
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/profile" className={styles.primaryBtn}>
            Manage Profile
          </Link>
          {isAdmin && (
            <Link to="/admin" className={styles.secondaryBtn}>
              Open Admin Dashboard
            </Link>
          )}
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Account Role</h2>
          <p className={styles.cardValue}>{user?.role}</p>
          <p className={styles.cardNote}>
            Role-based access control is active across routes and API endpoints.
          </p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Subjects &amp; Quizzes</h2>
          <p className={styles.cardValue}>Phase 3 &amp; 4</p>
          <p className={styles.cardNote}>
            Subject catalog, question bank, randomized quizzes, and countdown
            timers arrive next.
          </p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Analytics &amp; Leaderboard</h2>
          <p className={styles.cardValue}>Phase 5 &amp; 6</p>
          <p className={styles.cardNote}>
            Instant answer review, attempt history, charts, and scoreboards.
          </p>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
