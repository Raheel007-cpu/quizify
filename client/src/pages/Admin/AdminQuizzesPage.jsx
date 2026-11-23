import { useCallback, useEffect, useMemo, useState } from 'react';
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Modal from '../../components/Modal/Modal';
import Pagination from '../../components/Pagination/Pagination';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useToast } from '../../hooks/useToast';
import { getCategories } from '../../services/categoryService';
import { getQuestions } from '../../services/questionService';
import {
  createQuiz,
  deleteQuiz,
  getQuizById,
  getQuizzes,
  updateQuiz,
} from '../../services/quizService';
import styles from './AdminPages.module.css';

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
];

const DIFFICULTY_BADGE = {
  EASY: styles.badgeEasy,
  MEDIUM: styles.badgeMedium,
  HARD: styles.badgeHard,
};

const EMPTY_FORM = {
  categoryId: '',
  title: '',
  description: '',
  difficulty: 'MEDIUM',
  timeLimit: 5,
  passingScore: 60,
  questionCount: 5,
  status: 'DRAFT',
  questionIds: [],
};

function AdminQuizzesPage() {
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [categories, setCategories] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [bankSearch, setBankSearch] = useState('');
  const [bankCategoryOnly, setBankCategoryOnly] = useState(true);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catRes, qRes] = await Promise.all([
          getCategories(),
          getQuestions({ limit: 100 }),
        ]);
        setCategories(catRes.data.categories || []);
        setBankQuestions(qRes.data.questions || []);
      } catch (err) {
        showToast(err.message || 'Failed to load categories or bank.', 'error');
      }
    };
    loadMetadata();
  }, [showToast]);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getQuizzes({
        page,
        limit: 10,
        ...(search ? { search } : {}),
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
        ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
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
  }, [page, search, categoryFilter, difficultyFilter, statusFilter, showToast]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const filteredBankQuestions = useMemo(() => {
    return bankQuestions.filter((q) => {
      if (bankCategoryOnly && form.categoryId && String(q.categoryId) !== form.categoryId) {
        return false;
      }
      if (
        bankSearch.trim() &&
        !q.questionText.toLowerCase().includes(bankSearch.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [bankQuestions, bankCategoryOnly, form.categoryId, bankSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0] ? String(categories[0].id) : '',
    });
    setBankSearch('');
    setBankCategoryOnly(true);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = async (quiz) => {
    setFormError('');
    setBankSearch('');
    try {
      const res = await getQuizById(quiz.id);
      const detail = res.data.quiz;
      setEditing(detail);
      setForm({
        categoryId: String(detail.categoryId),
        title: detail.title,
        description: detail.description || '',
        difficulty: detail.difficulty,
        timeLimit: detail.timeLimit,
        passingScore: detail.passingScore,
        questionCount: detail.questionCount,
        status: detail.status,
        questionIds: (detail.quizQuestions || []).map((qq) => qq.questionId),
      });
      setModalOpen(true);
    } catch (err) {
      showToast(err.message || 'Failed to load quiz details.', 'error');
    }
  };

  const toggleQuestion = (questionId) => {
    setForm((prev) => {
      const exists = prev.questionIds.includes(questionId);
      return {
        ...prev,
        questionIds: exists
          ? prev.questionIds.filter((id) => id !== questionId)
          : [...prev.questionIds, questionId],
      };
    });
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredBankQuestions.map((q) => q.id);
    setForm((prev) => ({
      ...prev,
      questionIds: [...new Set([...prev.questionIds, ...filteredIds])],
    }));
  };

  const handleTogglePublish = async (quiz) => {
    const nextStatus = quiz.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await updateQuiz(quiz.id, { status: nextStatus });
      showToast(
        nextStatus === 'PUBLISHED' ? 'Quiz published!' : 'Quiz moved to draft.',
        'success'
      );
      loadQuizzes();
    } catch (err) {
      showToast(err.message || 'Could not update quiz status.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.categoryId) {
      setFormError('Title and category are required.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        categoryId: Number(form.categoryId),
        title: form.title.trim(),
        description: form.description.trim(),
        difficulty: form.difficulty,
        timeLimit: Number(form.timeLimit),
        passingScore: Number(form.passingScore),
        questionCount: Number(form.questionCount),
        status: form.status,
        questionIds: form.questionIds,
      };
      if (editing) {
        await updateQuiz(editing.id, payload);
        showToast('Quiz updated.', 'success');
      } else {
        await createQuiz(payload);
        showToast('Quiz created.', 'success');
      }
      setModalOpen(false);
      loadQuizzes();
    } catch (err) {
      setFormError(err.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuiz(deleteTarget.id);
      showToast('Quiz deleted.', 'success');
      setDeleteTarget(null);
      loadQuizzes();
    } catch (err) {
      showToast(err.message || 'Failed to delete quiz.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quiz Management</h1>
          <p className={styles.subtitle}>
            Configure quizzes, timers, passing scores, and select bank questions.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={openCreate}
          disabled={categories.length === 0}
        >
          + Create Quiz
        </button>
      </div>

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search quizzes..."
            ariaLabel="Search quizzes"
          />
          <FilterDropdown
            label="Category"
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
            allLabel="All Categories"
            options={categories.map((c) => ({
              value: String(c.id),
              label: `${c.subject?.name} — ${c.name}`,
            }))}
          />
          <FilterDropdown
            label="Difficulty"
            value={difficultyFilter}
            onChange={(val) => {
              setDifficultyFilter(val);
              setPage(1);
            }}
            allLabel="All Levels"
            options={DIFFICULTY_OPTIONS}
          />
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            allLabel="All Statuses"
            options={STATUS_OPTIONS}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading quizzes..." />
        ) : quizzes.length === 0 ? (
          <div className={styles.emptyState}>No quizzes found.</div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Category</th>
                    <th>Config</th>
                    <th>Bank Pool</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id}>
                      <td>
                        <strong>{quiz.title}</strong>
                        <div className={styles.subtitle}>
                          <span
                            className={`${styles.badge} ${
                              DIFFICULTY_BADGE[quiz.difficulty] || ''
                            }`}
                          >
                            {quiz.difficulty}
                          </span>
                        </div>
                      </td>
                      <td>
                        {quiz.category?.subject?.name}
                        <div className={styles.subtitle}>
                          {quiz.category?.name}
                        </div>
                      </td>
                      <td>
                        {quiz.questionCount} Qs &bull; {quiz.timeLimit} min
                        <div className={styles.subtitle}>
                          Pass: {quiz.passingScore}%
                        </div>
                      </td>
                      <td>{quiz._count?.quizQuestions ?? 0} linked</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            quiz.status === 'PUBLISHED'
                              ? styles.badgePublished
                              : styles.badgeDraft
                          }`}
                        >
                          {quiz.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => openEdit(quiz)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => handleTogglePublish(quiz)}
                          >
                            {quiz.status === 'PUBLISHED'
                              ? 'Unpublish'
                              : 'Publish'}
                          </button>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => setDeleteTarget(quiz)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Quiz' : 'Create Quiz'}
        size="lg"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {formError && <div className={styles.errorBox}>{formError}</div>}

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="quiz-title" className={styles.label}>
                Quiz Title
              </label>
              <input
                id="quiz-title"
                type="text"
                className={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., JavaScript Fundamentals"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="quiz-cat" className={styles.label}>
                Category
              </label>
              <select
                id="quiz-cat"
                className={styles.select}
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.subject?.name} &mdash; {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="quiz-desc" className={styles.label}>
              Description
            </label>
            <textarea
              id="quiz-desc"
              className={styles.textarea}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="quiz-diff" className={styles.label}>
                Difficulty
              </label>
              <select
                id="quiz-diff"
                className={styles.select}
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="quiz-time" className={styles.label}>
                Time Limit (minutes)
              </label>
              <input
                id="quiz-time"
                type="number"
                min={1}
                max={180}
                className={styles.input}
                value={form.timeLimit}
                onChange={(e) =>
                  setForm({ ...form, timeLimit: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="quiz-pass" className={styles.label}>
                Passing Score (%)
              </label>
              <input
                id="quiz-pass"
                type="number"
                min={1}
                max={100}
                className={styles.input}
                value={form.passingScore}
                onChange={(e) =>
                  setForm({ ...form, passingScore: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="quiz-count" className={styles.label}>
                Questions per Attempt
              </label>
              <input
                id="quiz-count"
                type="number"
                min={1}
                max={100}
                className={styles.input}
                value={form.questionCount}
                onChange={(e) =>
                  setForm({ ...form, questionCount: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="quiz-status" className={styles.label}>
                Status
              </label>
              <select
                id="quiz-status"
                className={styles.select}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.bankBox}>
            <div className={styles.header}>
              <div>
                <strong>Select Questions from Question Bank</strong>
                <div className={styles.subtitle}>
                  Selected: {form.questionIds.length} (needs at least{' '}
                  {form.questionCount} to publish)
                </div>
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={selectAllFiltered}
              >
                Select All Shown
              </button>
            </div>

            <div className={styles.toolbar} style={{ marginBottom: 0 }}>
              <SearchBar
                value={bankSearch}
                onChange={setBankSearch}
                placeholder="Filter bank questions..."
                ariaLabel="Filter bank questions"
              />
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={bankCategoryOnly}
                  onChange={(e) => setBankCategoryOnly(e.target.checked)}
                />
                Match quiz category only
              </label>
            </div>

            <div className={styles.bankList}>
              {filteredBankQuestions.length === 0 ? (
                <div className={styles.subtitle}>
                  No matching questions in the bank.
                </div>
              ) : (
                filteredBankQuestions.map((q) => (
                  <label key={q.id} className={styles.bankItem}>
                    <input
                      type="checkbox"
                      checked={form.questionIds.includes(q.id)}
                      onChange={() => toggleQuestion(q.id)}
                    />
                    <div className={styles.bankItemText}>
                      <div>{q.questionText}</div>
                      <div className={styles.bankItemMeta}>
                        <span>{q.category?.name}</span>
                        <span>&bull;</span>
                        <span>{q.difficulty}</span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? 'Saving...' : editing ? 'Update Quiz' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Quiz"
        size="sm"
      >
        <p style={{ marginBottom: '1rem' }}>
          Delete quiz <strong>{deleteTarget?.title}</strong>?
        </p>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default AdminQuizzesPage;
