import styles from './LoadingSpinner.module.css';

function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.spinner} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

export default LoadingSpinner;
