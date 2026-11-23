import { useEffect, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { listUsers } from '../../services/userService';
import styles from './AdminDashboardPage.module.css';

function AdminDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        const response = await listUsers();
        if (mounted) {
          setUsers(response.data.users || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Unable to fetch users.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <span className={styles.badge}>Admin Console</span>
        <h1 className={styles.title}>Quizify Administration</h1>
        <p className={styles.subtitle}>
          Signed in as <strong>{user?.name}</strong> ({user?.role}). Role-based
          authorization protects this console and all admin API endpoints.
        </p>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Registered Users</h2>
            <p className={styles.cardSubtitle}>
              Fetched from protected admin endpoint <code>GET /api/users</code>
            </p>
          </div>
          <span className={styles.countPill}>{users.length} total</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <LoadingSpinner label="Loading registered users..." />
          </div>
        ) : error ? (
          <div className={styles.errorBox} role="alert">
            {error}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry.id}>
                    <td>#{entry.id}</td>
                    <td>{entry.name}</td>
                    <td>{entry.email}</td>
                    <td>
                      <span
                        className={`${styles.roleTag} ${
                          entry.role === 'ADMIN'
                            ? styles.roleAdmin
                            : styles.roleStudent
                        }`}
                      >
                        {entry.role}
                      </span>
                    </td>
                    <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboardPage;
