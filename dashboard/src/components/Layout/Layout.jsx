import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';

function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Дашборд', path: '/', icon: '📊' },
    { name: 'Блокировки', path: '/blocked', icon: '🚫' },
    { name: 'Настройки', path: '/settings', icon: '⚙️' },
    { name: 'Yandex.Direct', path: '/yandex', icon: '🔗' }
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.closed : ''}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🔒</span>
          {sidebarOpen && <span className={styles.logoText}>NoctoClick</span>}
        </div>

        <nav className={styles.nav}>
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span className={styles.navText}>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <button 
          className={styles.toggleBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {navigation.find(n => n.path === location.pathname)?.name || 'NoctoClick'}
          </h1>
          <div className={styles.headerActions}>
            <div className={styles.status}>
              <span className={styles.statusDot}></span>
              Система активна
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;