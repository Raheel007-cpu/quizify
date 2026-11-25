import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.text}>
          Quizify &mdash; Interactive Quiz &amp; Learning Platform
        </p>
        <p className={styles.meta}>
          &copy; {new Date().getFullYear()} Quizify. Learn, practice, and master
          every topic.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
