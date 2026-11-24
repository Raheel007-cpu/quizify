import { Link } from 'react-router-dom';
import styles from './EmptyState.module.css';

function EmptyState({
  title = 'Nothing here yet',
  description,
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.icon} aria-hidden="true">
        &#9734;
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className={styles.actionBtn}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionTo && onAction && (
        <button type="button" onClick={onAction} className={styles.actionBtn}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
