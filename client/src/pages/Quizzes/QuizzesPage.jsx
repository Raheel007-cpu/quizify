import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Pagination from '../../components/Pagination/Pagination';
import QuizCard from '../../components/QuizCard/QuizCard';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useToast } from '../../hooks/useToast';
import { getCategories } from '../../services/categoryService';
import { getQuizzes } from '../../services/quizService';
import { getSubjects } from '../../services/subjectService';
import styles from './QuizzesPage.module.css';

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const DURATION_OPTIONS = [
  { value: '5', label: 'Up to 5 min' },
  { value: '10', label: 'Up to 10 min' },
  { value: '15', label: 'Up to 15 min' },
  { value: '30', label: 'Up to 30 min' },
];

function QuizzesPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [quizzes, setQuizzes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subjectId, setSubjectId] = useState(
    searchParams.get('subjectId') || ''
  );
  const [categoryId, setCategoryId] = useState(
    searchParams.get('categoryId') || ''
  );
  const [difficulty, setDifficulty] = useState(
    searchParams.get('difficulty') || ''
  );
  const [maxDuration, setMaxDuration] = useState(
    searchParams.get('maxDuration') || ''
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const [subRes, catRes] = await Promise.all([
          getSubjects(),
          getCategories(),
        ]);
        setSubjects(subRes.data.subjects || []);
        setCategories(catRes.data.categories || []);
      } catch (err) {
        showToast(err.message || 'Failed to load filters.', 'error');
      }
    };
    loadTaxonomy();
  }, [showToast]);

  const filteredCategories = useMemo(() => {
    if (!subjectId) return categories;
    return categories.filter((c) => String(c.subjectId) === subjectId);
  }, [categories, subjectId]);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getQuizzes({
        page,
        limit: 9,
        status: 'PUBLISHED',
        ...(search ? { search } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(maxDuration ? { maxDuration } : {}),
      });
      setQuizzes(res.data.quizzes || []);
      setPagination(
        res.data.pagination || { page: 1, totalPages: 1, total: 0 }
      );
    } catch (err) {
      showToast(err.message || 'Failed to load quizzes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    subjectId,
    categoryId,
    difficulty,
    maxDuration,
    showToast,
  ]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleResetFilters = () => {
    setSearch('');
    setSubjectId('');
    setCategoryId('');
    setDifficulty('');
    setMaxDuration('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Available Quizzes</h1>
          <p className={styles.subtitle}>
            Filter by subject, topic, difficulty, or duration and start
            practicing.
          </p>
        </div>
      </div>

      <section className={styles.filterBar}>
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search quizzes by title or topic..."
          ariaLabel="Search quizzes"
        />
        <FilterDropdown
          label="Subject"
          value={subjectId}
          onChange={(val) => {
            setSubjectId(val);
            setCategoryId('');
            setPage(1);
          }}
          allLabel="All Subjects"
          options={subjects.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))}
        />
        <FilterDropdown
          label="Category"
          value={categoryId}
          onChange={(val) => {
            setCategoryId(val);
            setPage(1);
          }}
          allLabel="All Categories"
          options={filteredCategories.map((c) => ({
            value: String(c.id),
            label: c.name,
          }))}
        />
        <FilterDropdown
          label="Difficulty"
          value={difficulty}
          onChange={(val) => {
            setDifficulty(val);
            setPage(1);
          }}
          allLabel="All Levels"
          options={DIFFICULTY_OPTIONS}
        />
        <FilterDropdown
          label="Duration"
          value={maxDuration}
          onChange={(val) => {
            setMaxDuration(val);
            setPage(1);
          }}
          allLabel="Any Length"
          options={DURATION_OPTIONS}
        />
        {(search || subjectId || categoryId || difficulty || maxDuration) && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleResetFilters}
          >
            Reset
          </button>
        )}
      </section>

      {loading ? (
        <div className={styles.loadingState}>
          <LoadingSpinner label="Loading quizzes..." />
        </div>
      ) : quizzes.length === 0 ? (
        <div className={styles.emptyState}>
          No published quizzes match your current filters.
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default QuizzesPage;
