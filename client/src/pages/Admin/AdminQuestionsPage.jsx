import { useCallback, useEffect, useMemo, useState } from 'react';
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Modal from '../../components/Modal/Modal';
import Pagination from '../../components/Pagination/Pagination';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useToast } from '../../hooks/useToast';
import { getCategories } from '../../services/categoryService';
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  updateQuestion,
} from '../../services/questionService';
import { getSubjects } from '../../services/subjectService';
import styles from './AdminPages.module.css';

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const DIFFICULTY_BADGE_MAP = {
  EASY: styles.badgeEasy,
  MEDIUM: styles.badgeMedium,
  HARD: styles.badgeHard,
};

const EMPTY_FORM = {
  subjectId: '',
  categoryId: '',
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  difficulty: 'MEDIUM',
  explanation: '',
};

function AdminQuestionsPage() {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
        showToast(err.message || 'Failed to load subjects/categories.', 'error');
      }
    };
    loadTaxonomy();
  }, [showToast]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getQuestions({
        page,
        limit: 10,
        ...(search ? { search } : {}),
        ...(subjectFilter ? { subjectId: subjectFilter } : {}),
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
        ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
      });
      setQuestions(res.data.questions || []);
      setPagination(
        res.data.pagination || { page: 1, totalPages: 1, total: 0 }
      );
    } catch (err) {
      showToast(err.message || 'Failed to load questions.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, subjectFilter, categoryFilter, difficultyFilter, showToast]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const filteredFilterCategories = useMemo(() => {
    if (!subjectFilter) return categories;
    return categories.filter((c) => String(c.subjectId) === subjectFilter);
  }, [categories, subjectFilter]);

  const modalCategories = useMemo(() => {
    if (!form.subjectId) return categories;
    return categories.filter((c) => String(c.subjectId) === form.subjectId);
  }, [categories, form.subjectId]);

  const openCreate = () => {
    const firstCat = categories[0];
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      subjectId: firstCat ? String(firstCat.subjectId) : '',
      categoryId: firstCat ? String(firstCat.id) : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (question) => {
    setEditing(question);
    setForm({
      subjectId: question.category?.subject?.id
        ? String(question.category.subject.id)
        : '',
      categoryId: String(question.categoryId),
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      explanation: question.explanation || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleFormSubjectChange = (newSubjectId) => {
    const matchingCats = categories.filter(
      (c) => String(c.subjectId) === newSubjectId
    );
    setForm((prev) => ({
      ...prev,
      subjectId: newSubjectId,
      categoryId: matchingCats[0] ? String(matchingCats[0].id) : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.categoryId ||
      !form.questionText.trim() ||
      !form.optionA.trim() ||
      !form.optionB.trim() ||
      !form.optionC.trim() ||
      !form.optionD.trim()
    ) {
      setFormError('Category, question text, and all four options are required.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        categoryId: Number(form.categoryId),
        questionText: form.questionText.trim(),
        optionA: form.optionA.trim(),
        optionB: form.optionB.trim(),
        optionC: form.optionC.trim(),
        optionD: form.optionD.trim(),
        correctAnswer: form.correctAnswer,
        difficulty: form.difficulty,
        explanation: form.explanation.trim(),
      };
      if (editing) {
        await updateQuestion(editing.id, payload);
        showToast('Question updated.', 'success');
      } else {
        await createQuestion(payload);
        showToast('Question added to bank.', 'success');
      }
      setModalOpen(false);
      loadQuestions();
    } catch (err) {
      setFormError(err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuestion(deleteTarget.id);
      showToast('Question deleted.', 'success');
      setDeleteTarget(null);
      loadQuestions();
    } catch (err) {
      showToast(err.message || 'Could not delete question.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Question Bank</h1>
          <p className={styles.subtitle}>
            Reusable MCQ questions linked across multiple quizzes.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={openCreate}
          disabled={categories.length === 0}
        >
          + Add Question
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
            placeholder="Search question text or options..."
            ariaLabel="Search questions"
          />
          <FilterDropdown
            label="Subject"
            value={subjectFilter}
            onChange={(val) => {
              setSubjectFilter(val);
              setCategoryFilter('');
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
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
            allLabel="All Categories"
            options={filteredFilterCategories.map((c) => ({
              value: String(c.id),
              label: c.name,
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
        </div>

        {loading ? (
          <LoadingSpinner label="Loading question bank..." />
        ) : questions.length === 0 ? (
          <div className={styles.emptyState}>
            No questions match your filters.
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Subject / Category</th>
                    <th>Difficulty</th>
                    <th>Answer</th>
                    <th>Used In</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <div className={styles.truncate}>{q.questionText}</div>
                      </td>
                      <td>
                        <strong>{q.category?.subject?.name}</strong>
                        <div className={styles.subtitle}>
                          {q.category?.name}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            DIFFICULTY_BADGE_MAP[q.difficulty] || ''
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td>
                        <strong>{q.correctAnswer}</strong>
                      </td>
                      <td>{q._count?.quizQuestions ?? 0} quiz(zes)</td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => openEdit(q)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => setDeleteTarget(q)}
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
        title={editing ? 'Edit Question' : 'Add Question to Bank'}
        size="lg"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {formError && <div className={styles.errorBox}>{formError}</div>}

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="q-subject" className={styles.label}>
                Subject
              </label>
              <select
                id="q-subject"
                className={styles.select}
                value={form.subjectId}
                onChange={(e) => handleFormSubjectChange(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="q-category" className={styles.label}>
                Category
              </label>
              <select
                id="q-category"
                className={styles.select}
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                {modalCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="q-diff" className={styles.label}>
                Difficulty
              </label>
              <select
                id="q-diff"
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
          </div>

          <div className={styles.field}>
            <label htmlFor="q-text" className={styles.label}>
              Question Text
            </label>
            <textarea
              id="q-text"
              className={styles.textarea}
              value={form.questionText}
              onChange={(e) =>
                setForm({ ...form, questionText: e.target.value })
              }
              placeholder="Enter the MCQ prompt..."
            />
          </div>

          <div className={styles.formGrid}>
            {['A', 'B', 'C', 'D'].map((letter) => (
              <div key={letter} className={styles.field}>
                <label htmlFor={`opt-${letter}`} className={styles.label}>
                  Option {letter}
                </label>
                <input
                  id={`opt-${letter}`}
                  type="text"
                  className={styles.input}
                  value={form[`option${letter}`]}
                  onChange={(e) =>
                    setForm({ ...form, [`option${letter}`]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="q-answer" className={styles.label}>
                Correct Answer
              </label>
              <select
                id="q-answer"
                className={styles.select}
                value={form.correctAnswer}
                onChange={(e) =>
                  setForm({ ...form, correctAnswer: e.target.value })
                }
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="q-expl" className={styles.label}>
              Explanation (shown during answer review)
            </label>
            <textarea
              id="q-expl"
              className={styles.textarea}
              value={form.explanation}
              onChange={(e) =>
                setForm({ ...form, explanation: e.target.value })
              }
              placeholder="Explain why the correct answer is right..."
            />
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
              {saving
                ? 'Saving...'
                : editing
                ? 'Update Question'
                : 'Save Question'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Question"
        size="sm"
      >
        <p style={{ marginBottom: '1rem' }}>
          Are you sure you want to delete this question from the question bank?
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

export default AdminQuestionsPage;
