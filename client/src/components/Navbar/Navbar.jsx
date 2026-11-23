import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logoMark}>Q</span>
          <span className={styles.brandName}>Quizify</span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <Link to="/" className={styles.navLink}>
            Home
          </Link>
          <span className={styles.phaseBadge}>Phase 1: Setup</span>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
