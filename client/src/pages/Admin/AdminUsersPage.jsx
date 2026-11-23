import { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { listUsers, updateUserRole } from '../../services/userService';
import styles from './AdminPages.module.css';

function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers(search ? { search } : {});
      setUsers(res.data.users || []);
    } catch (err) {
      showToast(err.message || 'Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (targetUser, newRole) => {
    try {
      await updateUserRole(targetUser.id, newRole);
      showToast(`Updated ${targetUser.name}'s role to ${newRole}.`, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update role.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>
            View registered accounts and manage administrator privileges.
          </p>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email..."
            ariaLabel="Search users"
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading users..." />
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>No users found.</div>
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
                    <td>
                      <strong>{entry.name}</strong>
                    </td>
                    <td>{entry.email}</td>
                    <td>
                      <select
                        className={styles.select}
                        style={{ width: 'auto', padding: '0.35rem 0.6rem' }}
                        value={entry.role}
                        disabled={entry.id === currentUser?.id}
                        onChange={(e) =>
                          handleRoleChange(entry, e.target.value)
                        }
                        aria-label={`Role for ${entry.name}`}
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
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

export default AdminUsersPage;
