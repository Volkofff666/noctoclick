import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import styles from './ThemeToggle.module.css';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button 
      onClick={toggleTheme} 
      className={styles.themeToggle}
      aria-label="Переключить тему"
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
    >
      <div className={`${styles.iconWrapper} ${isDark ? styles.dark : styles.light}`}>
        <Sun className={styles.sunIcon} size={18} />
        <Moon className={styles.moonIcon} size={18} />
      </div>
    </button>
  );
}

export default ThemeToggle;