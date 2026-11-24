import styles from './Toast.module.css';

const TOAST_ICONS = {
  success: '✓',
  error: '!',
  warning: '⚠',
  info: 'i',
};

function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.container}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type] || styles.info}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <span className={styles.badgeIcon} aria-hidden="true">
            {TOAST_ICONS[toast.type] || TOAST_ICONS.info}
          </span>
          <span className={styles.message}>{toast.message}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toast;
