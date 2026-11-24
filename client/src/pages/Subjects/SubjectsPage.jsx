import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState/EmptyState';
import ErrorState from '../../components/ErrorState/ErrorState';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useToast } from '../../hooks/useToast';
import { getSubjects } from '../../services/subjectService';
import styles from './SubjectsPage.module.css';

function SubjectsPage() {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await getSubjects(search ? { search } : {});
      setSubjects(res.data.subjects || []);
    } catch (err) {
      const msg = err.message || 'Failed to load subjects.';
      setFetchError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Browse Subjects</h1>
          <p className={styles.subtitle}>
            Explore subjects and topics to find quizzes that match your goals.
          </p>
        </div>
        <div className={styles.searchWrap}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search subjects..."
            ariaLabel="Search subjects"
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <LoadingSpinner label="Loading subjects..." />
        </div>
      ) : fetchError ? (
        <ErrorState
          title="Could not load subjects"
          message={fetchError}
          onRetry={loadSubjects}
        />
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No subjects found"
          description="Try clearing your search term to see all available subjects."
          actionLabel={search ? 'Clear Search' : undefined}
          onAction={search ? () => setSearch('') : undefined}
        />
      ) : (
        <div className={styles.grid}>
          {subjects.map((subject) => (
            <article key={subject.id} className={styles.card}>
              <div className={styles.cardTop}>
                <h2 className={styles.cardTitle}>{subject.name}</h2>
                <span className={styles.countPill}>
                  {subject._count?.categories ?? 0} topics
                </span>
              </div>
              <p className={styles.cardDesc}>
                {subject.description ||
                  'Explore categorized quizzes in this subject.'}
              </p>

              {subject.categories?.length > 0 && (
                <div className={styles.tags}>
                  {subject.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/quizzes?subjectId=${subject.id}&categoryId=${cat.id}`}
                      className={styles.tag}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              <Link to={`/subjects/${subject.id}`} className={styles.cardLink}>
                Explore Subject &rarr;
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubjectsPage;
