import styles from './ProgressBar.module.css';

function ProgressBar({ value, max = 100, label }) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={styles.wrapper}>
      {label && (
        <div className={styles.meta}>
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.fill} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
