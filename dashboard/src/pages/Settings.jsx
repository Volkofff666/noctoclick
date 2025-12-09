import { useState } from 'react';
import { Check } from 'lucide-react';
import styles from './Settings.module.css';

function Settings() {
  const [settings, setSettings] = useState({
    maxClicksPerHour: 5,
    minTimeOnSite: 3,
    fraudScoreThreshold: 70,
    autoBlockEnabled: true,
    syncInterval: 60,
    blockDuration: 168
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // TODO: Save to API
    setTimeout(() => {
      console.log('Saving settings:', settings);
      setSaved(true);
      setSaving(false);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  return (
    <div className={styles.settings}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Пороги детекции фрода</h2>
          <p>Настройте чувствительность и правила обнаружения мошеннической активности</p>
        </div>
        
        <form onSubmit={handleSave}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                Максимум кликов в час
                <span className={styles.badge}>{settings.maxClicksPerHour}</span>
              </label>
              <input
                type="range"
                value={settings.maxClicksPerHour}
                onChange={(e) => setSettings({...settings, maxClicksPerHour: parseInt(e.target.value)})}
                min="1"
                max="20"
                className={styles.slider}
              />
              <small>Количество кликов с одного IP в час перед пометкой как подозрительный</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Минимальное время на сайте (сек)
                <span className={styles.badge}>{settings.minTimeOnSite}с</span>
              </label>
              <input
                type="range"
                value={settings.minTimeOnSite}
                onChange={(e) => setSettings({...settings, minTimeOnSite: parseInt(e.target.value)})}
                min="1"
                max="30"
                className={styles.slider}
              />
              <small>Минимальное время для определения легитимного визита</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Порог Fraud Score
                <span className={`${styles.badge} ${settings.fraudScoreThreshold >= 70 ? styles.badgeDanger : styles.badgeWarning}`}>
                  {settings.fraudScoreThreshold}
                </span>
              </label>
              <input
                type="range"
                value={settings.fraudScoreThreshold}
                onChange={(e) => setSettings({...settings, fraudScoreThreshold: parseInt(e.target.value)})}
                min="0"
                max="100"
                className={styles.slider}
              />
              <small>Пороговое значение для автоматической блокировки IP</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Длительность авто-блокировки (часов)
                <span className={styles.badge}>{settings.blockDuration}ч</span>
              </label>
              <input
                type="range"
                value={settings.blockDuration}
                onChange={(e) => setSettings({...settings, blockDuration: parseInt(e.target.value)})}
                min="24"
                max="720"
                step="24"
                className={styles.slider}
              />
              <small>Время блокировки IP-адресов ({Math.floor(settings.blockDuration / 24)} дней)</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Интервал синхронизации (минут)
                <span className={styles.badge}>{settings.syncInterval}м</span>
              </label>
              <input
                type="range"
                value={settings.syncInterval}
                onChange={(e) => setSettings({...settings, syncInterval: parseInt(e.target.value)})}
                min="5"
                max="1440"
                step="5"
                className={styles.slider}
              />
              <small>Частота синхронизации с Яндекс.Директ</small>
            </div>
          </div>

          <div className={styles.toggleGroup}>
            <div className={styles.toggle}>
              <input
                type="checkbox"
                id="autoBlock"
                checked={settings.autoBlockEnabled}
                onChange={(e) => setSettings({...settings, autoBlockEnabled: e.target.checked})}
                className={styles.toggleInput}
              />
              <label htmlFor="autoBlock" className={styles.toggleLabel}>
                <div className={styles.toggleSwitch}>
                  <span className={styles.toggleSlider}></span>
                </div>
                <div className={styles.toggleText}>
                  <span className={styles.toggleTitle}>Автоматическая блокировка IP</span>
                  <span className={styles.toggleDesc}>Включить автоматическую блокировку мошеннических IP-адресов</span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            {saved && (
              <span className={styles.savedMessage}>
                <Check size={16} />
                Настройки успешно сохранены
              </span>
            )}
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Информация о системе</h2>
          <p>Текущий статус и конфигурация системы</p>
        </div>
        
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Версия</div>
            <div className={styles.infoValue}>1.0.0</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>API Endpoint</div>
            <div className={styles.infoValue}>
              <code>{import.meta.env.VITE_API_URL || '/api'}</code>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Статус</div>
            <div className={styles.infoValue}>
              <span className={styles.statusBadge}>
                <span className={styles.statusDot}></span>
                Активна
              </span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Окружение</div>
            <div className={styles.infoValue}>
              {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Опасная зона</h2>
          <p>Необратимые и деструктивные действия</p>
        </div>
        
        <div className={styles.dangerZone}>
          <div className={styles.dangerItem}>
            <div>
              <div className={styles.dangerTitle}>Очистить все заблокированные IP</div>
              <div className={styles.dangerDesc}>Удалить все IP-адреса из списка блокировок</div>
            </div>
            <button className={styles.btnDanger}>Очистить всё</button>
          </div>
          <div className={styles.dangerItem}>
            <div>
              <div className={styles.dangerTitle}>Сбросить статистику</div>
              <div className={styles.dangerDesc}>Удалить все данные событий и статистику</div>
            </div>
            <button className={styles.btnDanger}>Сбросить данные</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;