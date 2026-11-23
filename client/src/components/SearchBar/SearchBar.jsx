import styles from './SearchBar.module.css';

function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  ariaLabel = 'Search',
}) {
  return (
    <div className={styles.wrapper}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={styles.input}
      />
    </div>
  );
}

export default SearchBar;
