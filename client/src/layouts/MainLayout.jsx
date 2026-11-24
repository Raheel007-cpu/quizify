import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import styles from './MainLayout.module.css';

function MainLayout({ children }) {
  return (
    <div className={styles.layout}>
      <Navbar />
      <div className={styles.contentColumn}>
        <main className={styles.main}>{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
