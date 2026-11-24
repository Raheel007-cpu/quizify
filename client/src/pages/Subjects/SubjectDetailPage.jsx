import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import QuizCard from '../../components/QuizCard/QuizCard';
import { getSubjectById } from '../../services/subjectService';
import styles from './SubjectsPage.module.css';

function SubjectDetailPage() {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadSubject = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getSubjectById(id);
        if (mounted) {
          setSubject(res.data.subject);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Subject not found.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSubject();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <LoadingSpinner label="Loading subject..." />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className={styles.emptyState}>
        <p style={{ marginBottom: '1rem' }}>{error || 'Subject not found.'}</p>
        <Link to="/subjects" className={styles.backLink}>
          &larr; Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div>
        <Link to="/subjects" className={styles.backLink}>
          &larr; All Subjects
        </Link>
        <h1 className={styles.title} style={{ marginTop: '0.5rem' }}>
          {subject.name}
        </h1>
        {subject.description && (
          <p className={styles.subtitle}>{subject.description}</p>
        )}
      </div>

      {subject.categories?.length === 0 ? (
        <div className={styles.emptyState}>
          No categories available under this subject yet.
        </div>
      ) : (
        subject.categories.map((cat) => (
          <section key={cat.id} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <div>
                <h2 className={styles.cardTitle}>{cat.name}</h2>
                {cat.description && (
                  <p className={styles.subtitle}>{cat.description}</p>
                )}
              </div>
              <span className={styles.countPill}>
                {cat.quizzes?.length ?? 0} quiz(zes)
              </span>
            </div>

            {cat.quizzes?.length > 0 ? (
              <div className={styles.grid}>
                {cat.quizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            ) : (
              <p className={styles.subtitle}>
                No published quizzes in this topic yet.
              </p>
            )}
          </section>
        ))
      )}
    </div>
  );
}

export default SubjectDetailPage;
