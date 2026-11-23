import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { getAdminOverview } from '../../services/adminService';
import styles from './AdminDashboardPage.module.css';

function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadOverview = async () => {
      try {
        const res = await getAdminOverview();
        if (mounted) {
          setOverview(res.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load admin overview.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <LoadingSpinner label="Loading admin overview..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorBox} role="alert">
        {error}
      </div>
    );
  }

  const stats = overview?.stats || {};

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <span className={styles.badge}>Admin Overview</span>
        <h1 className={styles.title}>Platform Control Center</h1>
        <p className={styles.subtitle}>
          Manage subjects, categories, question bank items, quizzes, and users.
        </p>
      </section>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Users</span>
          <strong className={styles.statValue}>{stats.totalUsers ?? 0}</strong>
          <Link to="/admin/users" className={styles.statLink}>
            Manage users &rarr;
          </Link>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Quizzes</span>
          <strong className={styles.statValue}>{stats.totalQuizzes ?? 0}</strong>
          <span className={styles.statSub}>
            {stats.publishedQuizzes ?? 0} published
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Questions</span>
          <strong className={styles.statValue}>
            {stats.totalQuestions ?? 0}
          </strong>
          <Link to="/admin/questions" className={styles.statLink}>
            Open question bank &rarr;
          </Link>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Attempts</span>
          <strong className={styles.statValue}>
            {stats.totalAttempts ?? 0}
          </strong>
          <Link to="/admin/attempts" className={styles.statLink}>
            View attempts &rarr;
          </Link>
        </div>
      </section>

      <section className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Curriculum Structure</h2>
            <Link to="/admin/subjects" className={styles.statLink}>
              Manage &rarr;
            </Link>
          </div>
          <div className={styles.miniGrid}>
            <div className={styles.miniBox}>
              <span>Subjects</span>
              <strong>{stats.totalSubjects ?? 0}</strong>
            </div>
            <div className={styles.miniBox}>
              <span>Categories</span>
              <strong>{stats.totalCategories ?? 0}</strong>
            </div>
          </div>

          <h3 className={styles.subHeading}>Questions by Difficulty</h3>
          <div className={styles.pillRow}>
            {(overview?.questionsByDifficulty || []).map((item) => (
              <span key={item.difficulty} className={styles.diffPill}>
                {item.difficulty}: <strong>{item.count}</strong>
              </span>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Quizzes</h2>
            <Link to="/admin/quizzes" className={styles.statLink}>
              All quizzes &rarr;
            </Link>
          </div>
          {overview?.recentQuizzes?.length ? (
            <ul className={styles.list}>
              {overview.recentQuizzes.map((quiz) => (
                <li key={quiz.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemTitle}>{quiz.title}</div>
                    <div className={styles.itemMeta}>
                      {quiz.category?.subject?.name} &bull; {quiz.category?.name}{' '}
                      &bull; {quiz.difficulty}
                    </div>
                  </div>
                  <span
                    className={`${styles.roleTag} ${
                      quiz.status === 'PUBLISHED'
                        ? styles.statusPub
                        : styles.roleStudent
                    }`}
                  >
                    {quiz.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.cardSubtitle}>No quizzes created yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
