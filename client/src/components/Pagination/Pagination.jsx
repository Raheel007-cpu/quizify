import styles from './Pagination.module.css';

function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1 && !total) {
    return null;
  }

  return (
    <div className={styles.container}>
      <span className={styles.info}>
        Page {page} of {totalPages}
        {typeof total === 'number' ? ` (${total} total)` : ''}
      </span>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
