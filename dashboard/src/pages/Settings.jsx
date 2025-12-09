import { useState } from 'react';
import styles from './Settings.module.css';

function Settings() {
  const [settings, setSettings] = useState({
    maxClicksPerHour: 5,
    minTimeOnSite: 3,
    fraudScoreThreshold: 70,
    autoBlockEnabled: true,
    syncInterval: 60
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // TODO: Save to API
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={styles.settings}>
      <div className={styles.section}>
        <h2>Пороги детекции фрода</h2>
        <form onSubmit={handleSave}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Макс. кликов в час</label>
              <input
                type="number"
                value={settings.maxClicksPerHour}
                onChange={(e) => setSettings({...settings, maxClicksPerHour: parseInt(e.target.value)})}
                min="1"
                max="100"
              />
              <small>Количество кликов с одного IP за час</small>
            </div>

            <div className={styles.formGroup}>
              <label>Мин. время на сайте (сек)</label>
              <input
                type="number"
                value={settings.minTimeOnSite}
                onChange={(e) => setSettings({...settings, minTimeOnSite: parseInt(e.target.value)})}
                min="1"
                max="60"
              />
              <small>Минимальное время для легитимного посещения</small>
            </div>

            <div className={styles.formGroup}>
              <label>Fraud Score порог</label>
              <input
                type="number"
                value={settings.fraudScoreThreshold}
                onChange={(e) => setSettings({...settings, fraudScoreThreshold: parseInt(e.target.value)})}
                min="0"
                max="100"
              />
              <small>Порог для автоматической блокировки</small>
            </div>

            <div className={styles.formGroup}>
              <label>Интервал синхронизации (мин)</label>
              <input
                type="number"
                value={settings.syncInterval}
                onChange={(e) => setSettings({...settings, syncInterval: parseInt(e.target.value)})}
                min="5"
                max="1440"
              />
              <small>Как часто синхронизировать с Yandex</small>
            </div>
          </div>

          <div className={styles.checkbox}>
            <input
              type="checkbox"
              id="autoBlock"
              checked={settings.autoBlockEnabled}
              onChange={(e) => setSettings({...settings, autoBlockEnabled: e.target.checked})}
            />
            <label htmlFor="autoBlock">
              Автоматическая блокировка IP
            </label>
          </div>

          <div className={styles.actions}>
            {saved && <span className={styles.saved}>✓ Сохранено</span>}
            <button type="submit" className={styles.btnPrimary}>
              Сохранить настройки
            </button>
          </div>
        </form>
      </div>

      <div className={styles.section}>
        <h2>Информация о системе</h2>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Версия:</span>
            <span>1.0.0</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>API:</span>
            <span>{import.meta.env.VITE_API_URL || '/api'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Статус:</span>
            <span className={styles.statusActive}>• Активна</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;