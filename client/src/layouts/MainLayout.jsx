import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import styles from './MainLayout.module.css';

function MainLayout({ children }) {
  return (
    <div className={styles.layout}>
      <a href="#main-content" className="skipLink">
        Skip to main content
      </a>
      <Navbar />
      <div className={styles.contentColumn}>
        <main id="main-content" tabIndex={-1} className={styles.main}>
          <div className="pageEnter">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
