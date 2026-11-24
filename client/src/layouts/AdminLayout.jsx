import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './AdminLayout.module.css';

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/subjects', label: 'Subjects' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/questions', label: 'Question Bank' },
  { to: '/admin/quizzes', label: 'Quizzes' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/attempts', label: 'Attempts' },
  { to: '/admin/analytics', label: 'Analytics' },
];

function AdminLayout() {
  return (
    <div className={styles.container}>
      <Sidebar title="Admin Console" items={ADMIN_NAV_ITEMS} />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
