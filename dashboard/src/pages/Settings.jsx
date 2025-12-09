import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, Shield, Bell, Zap, Settings as SettingsIcon } from 'lucide-react';
import { sitesAPI } from '../utils/api';
import { useToast } from '../components/Toast/ToastContainer';
import EmptyState from '../components/EmptyState/EmptyState';
import styles from './Settings.module.css';

function Settings() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const siteId = searchParams.get('site');
  
  const [settings, setSettings] = useState({
    maxClicksPerHour: 5,
    minTimeOnSite: 3,
    fraudScoreThreshold: 70,
    autoBlockEnabled: true,
    blockDuration: 168,
    checkVPN: true,
    checkProxy: true,
    checkBot: true,
    checkDeviceFingerprint: true,
    notifyOnFraud: false,
    notifyEmail: '',
    notifyTelegram: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (siteId) {
      loadSettings();
    }
  }, [siteId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await sitesAPI.getById(siteId);
      if (data.site.settings) {
        setSettings({
          ...settings,
          ...data.site.settings
        });
      }
    } catch (err) {
      console.error('Load settings error:', err);
      toast.error('Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await sitesAPI.update(siteId, { settings });
      toast.success('Настройки успешно сохранены');
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Сбросить все настройки на значения по умолчанию?')) {
      setSettings({
        maxClicksPerHour: 5,
        minTimeOnSite: 3,
        fraudScoreThreshold: 70,
        autoBlockEnabled: true,
        blockDuration: 168,
        checkVPN: true,
        checkProxy: true,
        checkBot: true,
        checkDeviceFingerprint: true,
        notifyOnFraud: false,
        notifyEmail: '',
        notifyTelegram: ''
      });
      toast.info('Настройки сброшены. Нажмите "Сохранить" для применения.');
    }
  };

  if (!siteId) {
    return (
      <EmptyState
        icon={SettingsIcon}
        title="Выберите сайт для настройки"
        description="Используйте выпадающий список в шапке, чтобы выбрать сайт и настроить параметры защиты от скликивания."
      />
    );
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка настроек...</div>;
  }

  return (
    <div className={styles.settings}>
      <div className={styles.header}>
        <div>
          <h1>Настройки защиты</h1>
          <p>Настройте параметры обнаружения фрода и автоматической блокировки</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Основные параметры защиты */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Shield size={24} />
            <div>
              <h2>Параметры обнаружения</h2>
              <p>Настройте чувствительность системы защиты от фрода</p>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label>
                Максимум кликов в час
                <span className={styles.hint}>С одного IP адреса</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.maxClicksPerHour}
                onChange={(e) => setSettings({...settings, maxClicksPerHour: parseInt(e.target.value)})}
              />
              <small>Рекомендуем: 3-10 кликов</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Минимальное время на сайте (сек)
                <span className={styles.hint}>До клика по рекламе</span>
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.minTimeOnSite}
                onChange={(e) => setSettings({...settings, minTimeOnSite: parseInt(e.target.value)})}
              />
              <small>Рекомендуем: 2-5 секунд</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Порог Fraud Score
                <span className={styles.hint}>0-100 баллов</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.fraudScoreThreshold}
                onChange={(e) => setSettings({...settings, fraudScoreThreshold: parseInt(e.target.value)})}
                className={styles.range}
              />
              <div className={styles.rangeValue}>
                <span>{settings.fraudScoreThreshold}</span>
                <small>
                  {settings.fraudScoreThreshold < 50 && 'Низкая чувствительность'}
                  {settings.fraudScoreThreshold >= 50 && settings.fraudScoreThreshold < 75 && 'Средняя чувствительность'}
                  {settings.fraudScoreThreshold >= 75 && 'Высокая чувствительность'}
                </small>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                Длительность блокировки
                <span className={styles.hint}>Для автоблокировки</span>
              </label>
              <select
                value={settings.blockDuration}
                onChange={(e) => setSettings({...settings, blockDuration: parseInt(e.target.value)})}
              >
                <option value={1}>1 час</option>
                <option value={6}>6 часов</option>
                <option value={24}>24 часа</option>
                <option value={72}>3 дня</option>
                <option value={168}>7 дней (рекомендуется)</option>
                <option value={720}>30 дней</option>
                <option value={0}>Постоянно</option>
              </select>
            </div>
          </div>
        </div>

        {/* Методы проверки */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Zap size={24} />
            <div>
              <h2>Методы проверки</h2>
              <p>Выберите какие проверки использовать для обнаружения фрода</p>
            </div>
          </div>

          <div className={styles.checkboxGrid}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settings.autoBlockEnabled}
                onChange={(e) => setSettings({...settings, autoBlockEnabled: e.target.checked})}
              />
              <div>
                <strong>Автоматическая блокировка</strong>
                <span>Блокировать подозрительные IP автоматически</span>
              </div>
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settings.checkVPN}
                onChange={(e) => setSettings({...settings, checkVPN: e.target.checked})}
              />
              <div>
                <strong>Проверка VPN</strong>
                <span>Обнаружение использования VPN сервисов</span>
              </div>
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settings.checkProxy}
                onChange={(e) => setSettings({...settings, checkProxy: e.target.checked})}
              />
              <div>
                <strong>Проверка Proxy</strong>
                <span>Обнаружение прокси серверов</span>
              </div>
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settings.checkBot}
                onChange={(e) => setSettings({...settings, checkBot: e.target.checked})}
              />
              <div>
                <strong>Проверка ботов</strong>
                <span>Определение автоматизированных систем</span>
              </div>
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settings.checkDeviceFingerprint}
                onChange={(e) => setSettings({...settings, checkDeviceFingerprint: e.target.checked})}
              />
              <div>
                <strong>Отпечаток устройства</strong>
                <span>Уникальная идентификация устройства</span>
              </div>
            </label>
          </div>
        </div>

        {/* Уведомления */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Bell size={24} />
            <div>
              <h2>Уведомления</h2>
              <p>Получайте оповещения о подозрительной активности</p>
            </div>
          </div>

          <div className={styles.grid}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settings.notifyOnFraud}
                onChange={(e) => setSettings({...settings, notifyOnFraud: e.target.checked})}
              />
              <div>
                <strong>Включить уведомления</strong>
                <span>При обнаружении фрода</span>
              </div>
            </label>

            {settings.notifyOnFraud && (
              <>
                <div className={styles.formGroup}>
                  <label>Email для уведомлений</label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={settings.notifyEmail}
                    onChange={(e) => setSettings({...settings, notifyEmail: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Telegram (опционально)</label>
                  <input
                    type="text"
                    placeholder="@username или chat_id"
                    value={settings.notifyTelegram}
                    onChange={(e) => setSettings({...settings, notifyTelegram: e.target.value})}
                  />
                  <small>Для настройки Telegram бота свяжитесь с поддержкой</small>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className={styles.actions}>
          <button type="button" onClick={handleReset} className={styles.btnSecondary}>
            Сбросить
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            <Save size={18} />
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;