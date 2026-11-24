import { ResponsiveContainer } from 'recharts';
import styles from './ChartCard.module.css';

function ChartCard({
  title,
  subtitle,
  hasData = true,
  emptyMessage = 'No data recorded yet.',
  height = 280,
  children,
}) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {hasData ? (
        <div className={styles.chartWrap} style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={styles.empty} style={{ minHeight: Math.min(180, height) }}>
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

export default ChartCard;

