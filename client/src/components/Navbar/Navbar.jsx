import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import styles from './Navbar.module.css';

function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast('You have been logged out.', 'info');
    navigate('/login');
  };

  const getLinkClass = ({ isActive }) =>
    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logoMark}>Q</span>
          <span className={styles.brandName}>Quizify</span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink to="/" end className={getLinkClass}>
            Home
          </NavLink>
          <NavLink to="/subjects" className={getLinkClass}>
            Subjects
          </NavLink>
          <NavLink to="/quizzes" className={getLinkClass}>
            Quizzes
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={getLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/reports" className={getLinkClass}>
                Reports
              </NavLink>
              <NavLink to="/profile" className={getLinkClass}>
                Profile
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={getLinkClass}>
                  Admin
                </NavLink>
              )}

              <div className={styles.userActions}>
                <span className={styles.userPill}>
                  {user.name}
                  <span className={styles.roleTag}>{user.role}</span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.logoutBtn}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className={styles.authLinks}>
              <NavLink to="/login" className={getLinkClass}>
                Login
              </NavLink>
              <Link to="/register" className={styles.registerBtn}>
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
