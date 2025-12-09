import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Shield } from 'lucide-react';
import { authAPI } from '../utils/api';
import styles from './Auth.module.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      // Сохраняем токены
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Переходим на страницу сайтов
      navigate('/sites');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <Shield size={48} strokeWidth={2} />
          <h1>NoctoClick</h1>
          <p>Защита от скликивания</p>
        </div>

        <h2>Вход в аккаунт</h2>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              <Lock size={18} />
              Пароль
            </label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;