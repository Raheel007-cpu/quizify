import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

function Sidebar({ title, items }) {
  return (
    <aside className={styles.sidebar} aria-label={title || 'Section navigation'}>
      {title && <div className={styles.title}>{title}</div>}
      <nav className={styles.nav}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
