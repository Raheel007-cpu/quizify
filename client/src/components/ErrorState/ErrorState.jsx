import styles from './ErrorState.module.css';

function ErrorState({
  title = 'Unable to load content',
  message = 'Please try again in a moment.',
  onRetry,
}) {
  return (
    <div className={styles.card} role="alert">
      <div className={styles.icon} aria-hidden="true">
        !
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className={styles.retryBtn}>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
