import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Shield, Settings, Link as LinkIcon, ChevronLeft, ChevronRight, Globe, User, LogOut } from 'lucide-react';
import { authAPI, sitesAPI } from '../../utils/api';
import styles from './Layout.module.css';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sites, setSites] = useState([]);
  const [currentSite, setCurrentSite] = useState(null);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null);

  const navigation = [
    { name: 'Мои сайты', path: '/sites', icon: Globe },
    { name: 'Дашборд', path: '/dashboard', icon: BarChart3 },
    { name: 'Блокировки', path: '/blocked', icon: Shield },
    { name: 'Настройки', path: '/settings', icon: Settings },
    { name: 'Яндекс.Директ', path: '/yandex', icon: LinkIcon }
  ];

  useEffect(() => {
    loadUser();
    loadSites();
  }, []);

  const loadUser = async () => {
    try {
      const data = await authAPI.getMe();
      setUser(data);
    } catch (err) {
      console.error('Load user error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const loadSites = async () => {
    try {
      const data = await sitesAPI.getAll();
      setSites(data.sites);
      
      // Автоматически выбираем первый сайт
      if (data.sites.length > 0 && !currentSite) {
        const savedSiteId = localStorage.getItem('currentSiteId');
        const site = savedSiteId 
          ? data.sites.find(s => s.id === parseInt(savedSiteId)) 
          : data.sites[0];
        setCurrentSite(site || data.sites[0]);
      }
    } catch (err) {
      console.error('Load sites error:', err);
    }
  };

  const handleSelectSite = (site) => {
    setCurrentSite(site);
    localStorage.setItem('currentSiteId', site.id);
    setShowSiteDropdown(false);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      navigate('/login');
    }
  };

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
            {currentSite && sites.length > 0 && (
              <div className={styles.siteSelector}>
                <button 
                  onClick={() => setShowSiteDropdown(!showSiteDropdown)}
                  className={styles.siteSelectorBtn}
                >
                  <Globe size={18} />
                  <span>{currentSite.name}</span>
                  <ChevronRight size={16} className={showSiteDropdown ? styles.rotated : ''} />
                </button>
                
                {showSiteDropdown && (
                  <div className={styles.dropdown}>
                    {sites.map(site => (
                      <button
                        key={site.id}
                        onClick={() => handleSelectSite(site)}
                        className={`${styles.dropdownItem} ${currentSite?.id === site.id ? styles.active : ''}`}
                      >
                        <Globe size={16} />
                        <div>
                          <div className={styles.siteName}>{site.name}</div>
                          <div className={styles.siteDomain}>{site.domain}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userMenu}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={styles.userMenuBtn}
              >
                <User size={18} />
                {user && <span>{user.profile.fullName || user.email}</span>}
              </button>
              
              {showUserMenu && (
                <div className={styles.dropdown}>
                  <Link to="/profile" className={styles.dropdownItem} onClick={() => setShowUserMenu(false)}>
                    <User size={16} />
                    <span>Профиль</span>
                  </Link>
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    <LogOut size={16} />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet context={{ currentSite, sites }} />
        </main>
      </div>
    </div>
  );
}

export default Layout;