import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { validateLoginForm } from '../../utils/validators';
import styles from './AuthForm.module.css';

function LoginPage() {
  const { login, isAuthenticated, isAdmin, loading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateLoginForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      const user = await login(form);
      showToast(`Welcome back, ${user.name}!`, 'success');
      const redirectTo =
        location.state?.from?.pathname ||
        (user.role === 'ADMIN' ? '/admin' : '/dashboard');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please try again.');
      if (err.data?.errors) {
        setFieldErrors(err.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Sign in to Quizify</h1>
          <p className={styles.subtitle}>
            Continue your learning journey and track your quiz progress.
          </p>
        </div>

        {serverError && (
          <div className={styles.alertError} role="alert">
            {serverError}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`${styles.input} ${
                fieldErrors.email ? styles.inputError : ''
              }`}
            />
            {fieldErrors.email && (
              <span className={styles.errorText}>{fieldErrors.email}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`${styles.input} ${
                fieldErrors.password ? styles.inputError : ''
              }`}
            />
            {fieldErrors.password && (
              <span className={styles.errorText}>{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={styles.submitBtn}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.footerText}>
          Don&apos;t have an account?{' '}
          <Link to="/register" className={styles.footerLink}>
            Create one
          </Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
