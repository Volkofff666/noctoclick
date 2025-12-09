import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Building, Shield } from 'lucide-react';
import { authAPI } from '../utils/api';
import styles from './Auth.module.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        companyName: formData.companyName
      });
      
      // Сохраняем токены
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Переходим на страницу сайтов
      navigate('/sites');
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.error || 'Ошибка регистрации. Попробуйте снова.');
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

        <h2>Создание аккаунта</h2>

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
              <User size={18} />
              Ваше имя (необязательно)
            </label>
            <input
              type="text"
              placeholder="Иван Иванов"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              autoComplete="name"
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              <Building size={18} />
              Компания (необязательно)
            </label>
            <input
              type="text"
              placeholder="Название компании"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              autoComplete="organization"
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              <Lock size={18} />
              Пароль
            </label>
            <input
              type="password"
              placeholder="Минимум 6 символов"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              autoComplete="new-password"
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              <Lock size={18} />
              Повторите пароль
            </label>
            <input
              type="password"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;