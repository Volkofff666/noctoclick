import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Shield, Settings, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Layout.module.css';

function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Дашборд', path: '/', icon: BarChart3 },
    { name: 'Блокировки', path: '/blocked', icon: Shield },
    { name: 'Настройки', path: '/settings', icon: Settings },
    { name: 'Яндекс.Директ', path: '/yandex', icon: LinkIcon }
  ];

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.closed : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Shield size={28} strokeWidth={2.5} />
          </div>
          {sidebarOpen && <span className={styles.logoText}>NoctoClick</span>}
        </div>

        <nav className={styles.nav}>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>
                  <Icon size={20} />
                </span>
                {sidebarOpen && <span className={styles.navText}>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <button 
          className={styles.toggleBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Переключить сайдбар"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
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
              <span>Система активна</span>
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