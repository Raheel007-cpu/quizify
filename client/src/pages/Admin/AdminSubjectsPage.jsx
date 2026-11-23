import { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Modal from '../../components/Modal/Modal';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useToast } from '../../hooks/useToast';
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from '../../services/subjectService';
import styles from './AdminPages.module.css';

function AdminSubjectsPage() {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubjects(search ? { search } : {});
      setSubjects(res.data.subjects || []);
    } catch (err) {
      showToast(err.message || 'Failed to load subjects.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (subject) => {
    setEditing(subject);
    setForm({
      name: subject.name || '',
      description: subject.description || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Subject name is required.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await updateSubject(editing.id, form);
        showToast('Subject updated.', 'success');
      } else {
        await createSubject(form);
        showToast('Subject created.', 'success');
      }
      setModalOpen(false);
      loadSubjects();
    } catch (err) {
      setFormError(err.message || 'Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubject(deleteTarget.id);
      showToast('Subject deleted.', 'success');
      setDeleteTarget(null);
      loadSubjects();
    } catch (err) {
      showToast(err.message || 'Could not delete subject.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Subjects</h1>
          <p className={styles.subtitle}>
            Top-level academic domains organizing categories and quizzes.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={openCreate}>
          + Add Subject
        </button>
      </div>

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search subjects..."
            ariaLabel="Search subjects"
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading subjects..." />
        ) : subjects.length === 0 ? (
          <div className={styles.emptyState}>No subjects found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Categories</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td>
                      <strong>{subject.name}</strong>
                    </td>
                    <td>{subject.description || '—'}</td>
                    <td>{subject._count?.categories ?? 0}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => openEdit(subject)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => setDeleteTarget(subject)}
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
        title={editing ? 'Edit Subject' : 'Create Subject'}
        size="sm"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {formError && <div className={styles.errorBox}>{formError}</div>}
          <div className={styles.field}>
            <label htmlFor="subject-name" className={styles.label}>
              Name
            </label>
            <input
              id="subject-name"
              type="text"
              className={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Programming"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="subject-desc" className={styles.label}>
              Description
            </label>
            <textarea
              id="subject-desc"
              className={styles.textarea}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Brief overview of this subject"
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
              {saving ? 'Saving...' : editing ? 'Update Subject' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Subject"
        size="sm"
      >
        <p style={{ marginBottom: '1rem' }}>
          Are you sure you want to delete{' '}
          <strong>{deleteTarget?.name}</strong>?
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

export default AdminSubjectsPage;
