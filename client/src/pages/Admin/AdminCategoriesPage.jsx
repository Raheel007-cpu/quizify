import { useCallback, useEffect, useState } from 'react';
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Modal from '../../components/Modal/Modal';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useToast } from '../../hooks/useToast';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../../services/categoryService';
import { getSubjects } from '../../services/subjectService';
import styles from './AdminPages.module.css';

function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    subjectId: '',
    name: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, subRes] = await Promise.all([
        getCategories({
          ...(subjectFilter ? { subjectId: subjectFilter } : {}),
          ...(search ? { search } : {}),
        }),
        getSubjects(),
      ]);
      setCategories(catRes.data.categories || []);
      setSubjects(subRes.data.subjects || []);
    } catch (err) {
      showToast(err.message || 'Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  }, [subjectFilter, search, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
      name: '',
      description: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      subjectId: String(category.subjectId),
      name: category.name || '',
      description: category.description || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subjectId || !form.name.trim()) {
      setFormError('Subject and category name are required.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        subjectId: Number(form.subjectId),
        name: form.name.trim(),
        description: form.description.trim(),
      };
      if (editing) {
        await updateCategory(editing.id, payload);
        showToast('Category updated.', 'success');
      } else {
        await createCategory(payload);
        showToast('Category created.', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      showToast('Category deleted.', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Could not delete category.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories &amp; Topics</h1>
          <p className={styles.subtitle}>
            Organize topics under subjects (e.g., Programming &rarr; JavaScript).
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={openCreate}
          disabled={subjects.length === 0}
        >
          + Add Category
        </button>
      </div>

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search categories..."
            ariaLabel="Search categories"
          />
          <FilterDropdown
            label="Subject"
            value={subjectFilter}
            onChange={setSubjectFilter}
            allLabel="All Subjects"
            options={subjects.map((s) => ({ value: String(s.id), label: s.name }))}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading categories..." />
        ) : categories.length === 0 ? (
          <div className={styles.emptyState}>No categories found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Quizzes</th>
                  <th>Questions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <strong>{cat.name}</strong>
                      {cat.description && (
                        <div className={styles.subtitle}>{cat.description}</div>
                      )}
                    </td>
                    <td>{cat.subject?.name}</td>
                    <td>{cat._count?.quizzes ?? 0}</td>
                    <td>{cat._count?.questions ?? 0}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => openEdit(cat)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => setDeleteTarget(cat)}
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
        )}
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Create Category'}
        size="sm"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {formError && <div className={styles.errorBox}>{formError}</div>}
          <div className={styles.field}>
            <label htmlFor="cat-subject" className={styles.label}>
              Subject
            </label>
            <select
              id="cat-subject"
              className={styles.select}
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="cat-name" className={styles.label}>
              Name
            </label>
            <input
              id="cat-name"
              type="text"
              className={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., JavaScript"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="cat-desc" className={styles.label}>
              Description
            </label>
            <textarea
              id="cat-desc"
              className={styles.textarea}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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
              {saving ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        size="sm"
      >
        <p style={{ marginBottom: '1rem' }}>
          Delete category <strong>{deleteTarget?.name}</strong>?
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

export default AdminCategoriesPage;
