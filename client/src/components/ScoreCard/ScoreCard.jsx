import styles from './ScoreCard.module.css';

function ScoreCard({ label, value, tone = 'default', subtext }) {
  return (
    <div className={`${styles.card} ${styles[tone] || ''}`}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
      {subtext && <span className={styles.subtext}>{subtext}</span>}
    </div>
  );
}

export default ScoreCard;
