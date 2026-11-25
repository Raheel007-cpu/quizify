import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './HomePage.module.css';

function HomePage() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Quizify Platform</span>
        <h1 className={styles.title}>
          Interactive Quizzes, Instant Feedback, Measurable Mastery.
        </h1>
        <p className={styles.subtitle}>
          Register, sign in, and master topics through timed MCQ challenges,
          instant answer reviews, and analytics.
        </p>
        <div className={styles.heroActions}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={styles.primaryCta}>
                Go to Dashboard
              </Link>
              <Link to="/quizzes" className={styles.secondaryCta}>
                Browse Quizzes
              </Link>
              {isAdmin && (
                <Link to="/admin" className={styles.secondaryCta}>
                  Admin Console
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/register" className={styles.primaryCta}>
                Get Started
              </Link>
              <Link to="/login" className={styles.secondaryCta}>
                Sign In
              </Link>
              <Link to="/quizzes" className={styles.secondaryCta}>
                Explore Quizzes
              </Link>
            </>
          )}
        </div>
      </section>

      <section className={styles.featuresGrid} aria-label="Platform highlights">
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>01</span>
          <h2 className={styles.featureTitle}>Randomized Timed Quizzes</h2>
          <p className={styles.featureDesc}>
            Every attempt draws a fresh question set from the bank with a
            server-verified countdown timer.
          </p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>02</span>
          <h2 className={styles.featureTitle}>Instant Answer Review</h2>
          <p className={styles.featureDesc}>
            Receive immediate scores, pass/fail status, and detailed
            explanations inside your Reports.
          </p>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>03</span>
          <h2 className={styles.featureTitle}>Analytics &amp; Leaderboard</h2>
          <p className={styles.featureDesc}>
            Visualize score trends across subjects and difficulties and compete
            on the Quizify leaderboard.
          </p>
        </div>
      </section>

      <section className={styles.aboutCard} aria-label="About Quizify">
        <div className={styles.aboutHeader}>
          <div>
            <h2 className={styles.aboutTitle}>How Quizify Helps You Learn</h2>
            <p className={styles.aboutDesc}>
              Built for focused practice across Programming, Mathematics,
              Science, History, and Geography.
            </p>
          </div>
          <Link to="/subjects" className={styles.primaryCta}>
            Explore Subjects
          </Link>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepBox}>
            <span className={styles.stepLabel}>Step 1 &bull; Choose</span>
            <strong className={styles.stepTitle}>Pick a Subject &amp; Difficulty</strong>
            <p className={styles.stepText}>
              Filter quizzes by subject, topic, difficulty level, or time
              limit to fit your study session.
            </p>
          </div>

          <div className={styles.stepBox}>
            <span className={styles.stepLabel}>Step 2 &bull; Practice</span>
            <strong className={styles.stepTitle}>Focus Without Distractions</strong>
            <p className={styles.stepText}>
              Navigate smoothly between questions with keyboard shortcuts, live
              progress tracking, and auto-saved answers.
            </p>
          </div>

          <div className={styles.stepBox}>
            <span className={styles.stepLabel}>Step 3 &bull; Improve</span>
            <strong className={styles.stepTitle}>Review &amp; Track Growth</strong>
            <p className={styles.stepText}>
              Inspect every explanation in Reports, spot weak subjects in
              Analytics, and rise on the Leaderboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
