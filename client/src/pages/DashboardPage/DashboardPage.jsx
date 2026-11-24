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
          <Link to="/quizzes" className={styles.primaryBtn}>
            Browse Quizzes
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
          <h2 className={styles.cardTitle}>Account Role</h2>
          <p className={styles.cardValue}>{user?.role}</p>
          <p className={styles.cardNote}>
            Role-based access control is active across routes and API endpoints.
          </p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Interactive Quizzes</h2>
          <p className={styles.cardValue}>Ready</p>
          <p className={styles.cardNote}>
            Browse subjects, take randomized timed MCQ quizzes, and submit for
            backend evaluation.
          </p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Review &amp; Analytics</h2>
          <p className={styles.cardValue}>Phase 5 &amp; 6</p>
          <p className={styles.cardNote}>
            Full question-by-question answer review, attempt history, charts,
            and leaderboard arrive next.
          </p>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
