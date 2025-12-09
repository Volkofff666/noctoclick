import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, Code, Trash2, RefreshCw, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { sitesAPI } from '../utils/api';
import { useToast } from '../components/Toast/ToastContainer';
import EmptyState from '../components/EmptyState/EmptyState';
import styles from './Sites.module.css';

function Sites() {
  const navigate = useNavigate();
  const toast = useToast();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(null);
  const [newSite, setNewSite] = useState({ name: '', domain: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const data = await sitesAPI.getAll();
      setSites(data.sites);
    } catch (err) {
      console.error('Load sites error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Ошибка загрузки сайтов');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await sitesAPI.create(newSite);
      setNewSite({ name: '', domain: '' });
      setShowAddModal(false);
      await loadSites();
      toast.success('Сайт успешно добавлен!');
    } catch (err) {
      console.error('Add site error:', err);
      setError(err.response?.data?.error || 'Ошибка добавления сайта');
      toast.error('Не удалось добавить сайт');
    }
  };

  const handleDeleteSite = async (siteId, siteName) => {
    if (!confirm(`Вы уверены, что хотите удалить сайт "${siteName}"?`)) return;

    try {
      await sitesAPI.delete(siteId);
      await loadSites();
      toast.success(`Сайт "${siteName}" удалён`);
    } catch (err) {
      console.error('Delete site error:', err);
      toast.error('Ошибка удаления сайта');
    }
  };

  const handleRegenerateKey = async (siteId) => {
    if (!confirm('Вы уверены? Старый ключ перестанет работать.')) return;

    try {
      await sitesAPI.regenerateKey(siteId);
      await loadSites();
      toast.warning('Новый API ключ сгенерирован. Обновите трекер на сайте.');
    } catch (err) {
      console.error('Regenerate key error:', err);
      toast.error('Ошибка перегенерации ключа');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена!');
  };

  const getTrackerCode = (apiKey) => {
    return `<!-- NoctoClick Anti-Fraud Tracker -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.protocol}//${window.location.host}/tracker.js';
    script.async = true;
    script.setAttribute('data-api-key', '${apiKey}');
    document.head.appendChild(script);
  })();
</script>`;
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка сайтов...</div>;
  }

  return (
    <div className={styles.sites}>
      <div className={styles.header}>
        <div>
          <h1>Мои сайты</h1>
          <p>Управление сайтами, подключенными к NoctoClick</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}>
          <Plus size={18} />
          Добавить сайт
        </button>
      </div>

      {sites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="У вас пока нет сайтов"
          description="Добавьте первый сайт, чтобы начать защиту от скликивания рекламы. Это займёт всего минуту!"
          action={
            <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}>
              <Plus size={18} />
              Добавить первый сайт
            </button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {sites.map((site) => (
            <div key={site.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <Globe size={24} />
                  <div>
                    <h3>{site.name}</h3>
                    <span className={styles.domain}>{site.domain}</span>
                  </div>
                </div>
                <div className={styles.status}>
                  {site.tracker_installed ? (
                    <span className={styles.statusActive}>
                      <CheckCircle size={16} />
                      Активен
                    </span>
                  ) : (
                    <span className={styles.statusInactive}>
                      <AlertCircle size={16} />
                      Не установлен
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.info}>
                  <span className={styles.label}>API ключ:</span>
                  <code className={styles.apiKey}>
                    {site.api_key.substring(0, 20)}...
                    <button 
                      onClick={() => copyToClipboard(site.api_key)}
                      className={styles.copyBtn}
                      title="Скопировать"
                    >
                      <Copy size={14} />
                    </button>
                  </code>
                </div>
                {site.last_event_at && (
                  <div className={styles.info}>
                    <span className={styles.label}>Последнее событие:</span>
                    <span>{new Date(site.last_event_at).toLocaleString('ru')}</span>
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button 
                  onClick={() => navigate(`/dashboard?site=${site.id}`)}
                  className={styles.btnSecondary}
                >
                  Открыть дашборд
                </button>
                <button 
                  onClick={() => setShowInstallModal(site)}
                  className={styles.btnSecondary}
                >
                  <Code size={16} />
                  Инструкция
                </button>
                <button 
                  onClick={() => handleRegenerateKey(site.id)}
                  className={styles.btnSecondary}
                  title="Перегенерировать ключ"
                >
                  <RefreshCw size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteSite(site.id, site.name)}
                  className={styles.btnDanger}
                  title="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка добавления сайта */}
      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Добавить новый сайт</h2>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <form onSubmit={handleAddSite}>
              <div className={styles.formGroup}>
                <label>Название сайта</label>
                <input
                  type="text"
                  placeholder="Мой интернет-магазин"
                  value={newSite.name}
                  onChange={(e) => setNewSite({...newSite, name: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Домен</label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={newSite.domain}
                  onChange={(e) => setNewSite({...newSite, domain: e.target.value})}
                  required
                />
                <small>Укажите домен без http:// и www.</small>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} className={styles.btnCancel}>
                  Отмена
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка инструкции по установке */}
      {showInstallModal && (
        <div className={styles.modal} onClick={() => setShowInstallModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Установка трекера</h2>
            <p className={styles.subtitle}>
              Для сайта: <strong>{showInstallModal.name}</strong> ({showInstallModal.domain})
            </p>

            <div className={styles.instruction}>
              <h3>1. Скопируйте этот код</h3>
              <div className={styles.codeBlock}>
                <pre>{getTrackerCode(showInstallModal.api_key)}</pre>
                <button 
                  onClick={() => copyToClipboard(getTrackerCode(showInstallModal.api_key))}
                  className={styles.copyCodeBtn}
                >
                  <Copy size={16} />
                  Скопировать
                </button>
              </div>

              <h3>2. Вставьте код на сайт</h3>
              <p>Добавьте этот код в раздел <code>&lt;head&gt;</code> вашего сайта, желательно перед закрывающим тегом <code>&lt;/head&gt;</code>.</p>

              <h3>3. Проверьте установку</h3>
              <p>Откройте ваш сайт и перейдите на любую страницу. Через несколько секунд статус сайта изменится на "Активен".</p>
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setShowInstallModal(null)} className={styles.btnSubmit}>
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sites;