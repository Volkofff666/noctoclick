import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';

function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', path: '/', icon: 'chart' },
    { name: 'Blocked IPs', path: '/blocked', icon: 'shield' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
    { name: 'Yandex Direct', path: '/yandex', icon: 'link' }
  ];

  const getIcon = (icon) => {
    const icons = {
      chart: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
      shield: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      settings: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-2 2l-4.2 4.2M1 12h6m6 0h6m-13.2 5.2l4.2-4.2m2-2l4.2-4.2"></path>
        </svg>
      ),
      link: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
      )
    };
    return icons[icon] || null;
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.closed : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.84-1.01-6.5-4.41-6.5-8.5V8.47L12 5.69l6.5 2.78V11.5c0 4.09-2.66 7.49-6.5 8.5z"/>
              <path d="M9.5 11.5L8 13l3 3 5-5-1.5-1.5-3.5 3.5z"/>
            </svg>
          </div>
          {sidebarOpen && <span className={styles.logoText}>NoctoClick</span>}
        </div>

        <nav className={styles.nav}>
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{getIcon(item.icon)}</span>
              {sidebarOpen && <span className={styles.navText}>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <button 
          className={styles.toggleBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarOpen ? (
              <polyline points="15 18 9 12 15 6"></polyline>
            ) : (
              <polyline points="9 18 15 12 9 6"></polyline>
            )}
          </svg>
        </button>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              {navigation.find(n => n.path === location.pathname)?.name || 'NoctoClick'}
            </h1>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.status}>
              <span className={styles.statusDot}></span>
              <span>System Active</span>
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