import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <LoadingSpinner label="Checking admin permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          maxWidth: '520px',
          margin: '3rem auto',
          padding: '2rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-danger)' }}>
          403 &mdash; Access Denied
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          You need administrator privileges to view this page.
        </p>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-block',
            padding: '0.6rem 1.2rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            fontWeight: 600,
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return children || <Outlet />;
}

export default AdminRoute;
