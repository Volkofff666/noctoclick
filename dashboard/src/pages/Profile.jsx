import { useState, useEffect } from 'react';
import { User, Mail, Building, Phone, MessageCircle, Save, Lock } from 'lucide-react';
import { authAPI } from '../utils/api';
import styles from './Profile.module.css';

function Profile() {
  const [profile, setProfile] = useState({
    email: '',
    fullName: '',
    companyName: '',
    phone: '',
    telegram: ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getMe();
      setProfile({
        email: data.email,
        fullName: data.profile.fullName || '',
        companyName: data.profile.companyName || '',
        phone: data.profile.phone || '',
        telegram: data.profile.telegram || ''
      });
    } catch (err) {
      console.error('Load profile error:', err);
      setError('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await authAPI.updateProfile({
        fullName: profile.fullName,
        companyName: profile.companyName,
        phone: profile.phone,
        telegram: profile.telegram
      });
      setSuccess('Профиль успешно обновлён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.newPassword.length < 6) {
      setError('Новый пароль должен быть не менее 6 символов');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setSaving(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setSuccess('Пароль успешно изменён');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.response?.data?.error || 'Ошибка смены пароля');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка профиля...</div>;
  }

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <h1>Мой профиль</h1>
        <p>Управление личной информацией и настройками аккаунта</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* Основная информация */}
      <div className={styles.section}>
        <h2>Основная информация</h2>
        <form onSubmit={handleSaveProfile}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className={styles.disabled}
              />
              <small>Изменение email недоступно. Обратитесь в поддержку.</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                <User size={18} />
                Ваше имя
              </label>
              <input
                type="text"
                placeholder="Иван Иванов"
                value={profile.fullName}
                onChange={(e) => setProfile({...profile, fullName: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <Building size={18} />
                Компания
              </label>
              <input
                type="text"
                placeholder="Название компании"
                value={profile.companyName}
                onChange={(e) => setProfile({...profile, companyName: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <Phone size={18} />
                Телефон
              </label>
              <input
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                <MessageCircle size={18} />
                Telegram
              </label>
              <input
                type="text"
                placeholder="@username"
                value={profile.telegram}
                onChange={(e) => setProfile({...profile, telegram: e.target.value})}
              />
              <small>Для получения уведомлений</small>
            </div>
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            <Save size={18} />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>

      {/* Безопасность */}
      <div className={styles.section}>
        <h2>Безопасность</h2>
        
        {!showPasswordForm ? (
          <button 
            onClick={() => setShowPasswordForm(true)} 
            className={styles.btnSecondary}
          >
            <Lock size={18} />
            Изменить пароль
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className={styles.passwordForm}>
            <div className={styles.formGroup}>
              <label>Текущий пароль</label>
              <input
                type="password"
                placeholder="Введите текущий пароль"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Новый пароль</label>
              <input
                type="password"
                placeholder="Минимум 6 символов"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Повторите новый пароль</label>
              <input
                type="password"
                placeholder="Повторите пароль"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                required
              />
            </div>
            <div className={styles.formActions}>
              <button 
                type="button" 
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setError('');
                }}
                className={styles.btnCancel}
              >
                Отмена
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Сохранение...' : 'Изменить пароль'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;