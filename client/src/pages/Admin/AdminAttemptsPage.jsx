import { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Pagination from '../../components/Pagination/Pagination';
import { useToast } from '../../hooks/useToast';
import { getAdminAttempts } from '../../services/adminService';
import styles from './AdminPages.module.css';

function AdminAttemptsPage() {
  const { showToast } = useToast();
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminAttempts({ page, limit: 15 });
      setAttempts(res.data.attempts || []);
      setPagination(
        res.data.pagination || { page: 1, totalPages: 1, total: 0 }
      );
    } catch (err) {
      showToast(err.message || 'Failed to load attempts.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Student Attempts</h1>
          <p className={styles.subtitle}>
            Monitor quiz attempts, scores, and completion status across users.
          </p>
        </div>
      </div>

      <section className={styles.card}>
        {loading ? (
          <LoadingSpinner label="Loading quiz attempts..." />
        ) : attempts.length === 0 ? (
          <div className={styles.emptyState}>
            No quiz attempts recorded yet. Student quiz-taking flows arrive in
            Phase 4 &amp; Phase 5.
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.user?.name}</strong>
                        <div className={styles.subtitle}>{a.user?.email}</div>
                      </td>
                      <td>{a.quiz?.title}</td>
                      <td>
                        {a.score} ({Math.round(a.percentage)}%)
                      </td>
                      <td>{a.status}</td>
                      <td>{new Date(a.startedAt).toLocaleString()}</td>
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

export default AdminAttemptsPage;
