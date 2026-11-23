import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { updateProfile } from '../../services/userService';
import { validateProfileForm } from '../../utils/validators';
import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

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
    const errors = validateProfileForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setServerError('');
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
      };

      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
        payload.confirmNewPassword = form.confirmNewPassword;
      }

      const response = await updateProfile(payload);
      setUser(response.data.user);
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      setServerError(err.message || 'Failed to update profile.');
      if (err.data?.errors) {
        setFieldErrors(err.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.summaryCard}>
        <div className={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className={styles.name}>{user?.name}</h1>
          <p className={styles.email}>{user?.email}</p>
          <div className={styles.meta}>
            <span className={styles.roleBadge}>{user?.role}</span>
            {user?.createdAt && (
              <span className={styles.joined}>
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className={styles.formCard}>
        <h2 className={styles.sectionTitle}>Account Settings</h2>
        <p className={styles.sectionSubtitle}>
          Update your display name, email address, or password.
        </p>

        {serverError && (
          <div className={styles.alertError} role="alert">
            {serverError}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className={`${styles.input} ${
                  fieldErrors.name ? styles.inputError : ''
                }`}
              />
              {fieldErrors.name && (
                <span className={styles.errorText}>{fieldErrors.name}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`${styles.input} ${
                  fieldErrors.email ? styles.inputError : ''
                }`}
              />
              {fieldErrors.email && (
                <span className={styles.errorText}>{fieldErrors.email}</span>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <h3 className={styles.passwordHeading}>Change Password (Optional)</h3>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="currentPassword" className={styles.label}>
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={handleChange}
                className={`${styles.input} ${
                  fieldErrors.currentPassword ? styles.inputError : ''
                }`}
              />
              {fieldErrors.currentPassword && (
                <span className={styles.errorText}>
                  {fieldErrors.currentPassword}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="newPassword" className={styles.label}>
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={handleChange}
                className={`${styles.input} ${
                  fieldErrors.newPassword ? styles.inputError : ''
                }`}
              />
              {fieldErrors.newPassword && (
                <span className={styles.errorText}>
                  {fieldErrors.newPassword}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmNewPassword" className={styles.label}>
                Confirm New Password
              </label>
              <input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmNewPassword}
                onChange={handleChange}
                className={`${styles.input} ${
                  fieldErrors.confirmNewPassword ? styles.inputError : ''
                }`}
              />
              {fieldErrors.confirmNewPassword && (
                <span className={styles.errorText}>
                  {fieldErrors.confirmNewPassword}
                </span>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={saving}
              className={styles.saveBtn}
            >
              {saving ? 'Saving changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
