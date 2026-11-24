import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import styles from './Navbar.module.css';

const STORAGE_KEY = 'quizify_nav_collapsed';

function NavIcon({ name }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
        </svg>
      );
    case 'subjects':
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'quizzes':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...props}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'leaderboard':
      return (
        <svg {...props}>
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
          <path d="M17 5h2a2 2 0 0 1 0 4h-2" />
          <path d="M7 5H5a2 2 0 0 0 0 4h2" />
        </svg>
      );
    case 'admin':
      return (
        <svg {...props}>
          <path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case 'login':
      return (
        <svg {...props}>
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      );
    case 'register':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      );
    default:
      return null;
  }
}

function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    showToast('You have been logged out.', 'info');
    navigate('/login');
  };

  const getLinkClass = ({ isActive }) =>
    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink;

  const navItems = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/subjects', label: 'Subjects', icon: 'subjects' },
    { to: '/quizzes', label: 'Quizzes', icon: 'quizzes' },
    ...(isAuthenticated
      ? [
          { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
          { to: '/reports', label: 'Reports', icon: 'reports' },
          { to: '/analytics', label: 'Analytics', icon: 'analytics' },
          { to: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
          ...(isAdmin
            ? [{ to: '/admin', label: 'Admin', icon: 'admin' }]
            : []),
        ]
      : []),
  ];

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <div className={styles.mobileBar}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logoMark}>Q</span>
          <span className={styles.brandName}>Quizify</span>
        </Link>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${
          mobileOpen ? styles.mobileOpen : ''
        }`}
        aria-label="Main navigation"
      >
        <div className={styles.topSection}>
          <Link to="/" className={styles.brand} title="Quizify Home">
            <span className={styles.logoMark}>Q</span>
            {!collapsed && <span className={styles.brandName}>Quizify</span>}
          </Link>

          <button
            type="button"
            className={styles.collapseBtn}
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={getLinkClass}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.iconWrap}>
                <NavIcon name={item.icon} />
              </span>
              {!collapsed && (
                <span className={styles.linkLabel}>{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.bottomSection}>
          {isAuthenticated ? (
            <>
              <div className={styles.userMenu}>
                <Link
                  to="/profile"
                  className={styles.userPill}
                  aria-label={`${user.name} (${user.role}) — Account Settings`}
                  title={
                    collapsed
                      ? `${user.name} (${user.role}) — Account Settings`
                      : undefined
                  }
                >
                  <span className={styles.avatar}>{userInitial}</span>
                  {!collapsed && (
                    <span className={styles.userMeta}>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={styles.roleTag}>{user.role}</span>
                    </span>
                  )}
                </Link>

                <div className={styles.userDropdown}>
                  <div className={styles.dropdownCard}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownName}>
                        {user.name}{' '}
                        <span className={styles.roleTag}>{user.role}</span>
                      </div>
                      <div className={styles.dropdownEmail}>{user.email}</div>
                    </div>
                    <Link to="/profile" className={styles.dropdownLink}>
                      Account Settings
                    </Link>
                    <Link to="/reports" className={styles.dropdownLink}>
                      My Reports
                    </Link>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutBtn}
                title={collapsed ? 'Logout' : undefined}
              >
                <span className={styles.iconWrap}>
                  <NavIcon name="logout" />
                </span>
                {!collapsed && <span>Logout</span>}
              </button>
            </>
          ) : (
            <div className={styles.authLinks}>
              <NavLink
                to="/login"
                className={getLinkClass}
                title={collapsed ? 'Login' : undefined}
              >
                <span className={styles.iconWrap}>
                  <NavIcon name="login" />
                </span>
                {!collapsed && <span className={styles.linkLabel}>Login</span>}
              </NavLink>
              <Link
                to="/register"
                className={styles.registerBtn}
                title={collapsed ? 'Register' : undefined}
              >
                <span className={styles.iconWrap}>
                  <NavIcon name="register" />
                </span>
                {!collapsed && <span>Register</span>}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Navbar;
