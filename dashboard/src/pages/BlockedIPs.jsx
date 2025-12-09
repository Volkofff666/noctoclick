import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Trash2, Plus, Download, CheckCircle, Search } from 'lucide-react';
import { blockedAPI, sitesAPI } from '../utils/api';
import { useToast } from '../components/Toast/ToastContainer';
import EmptyState from '../components/EmptyState/EmptyState';
import { exportBlockedToCSV } from '../utils/exportCSV';
import styles from './BlockedIPs.module.css';

function BlockedIPs() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [blocked, setBlocked] = useState([]);
  const [filteredBlocked, setFilteredBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlock, setNewBlock] = useState({ ip: '', reason: '', duration: 168 });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSite, setCurrentSite] = useState(null);
  const siteId = searchParams.get('site');

  useEffect(() => {
    if (siteId) {
      loadBlocked();
      loadSiteInfo();
    }
  }, [siteId]);

  useEffect(() => {
    filterBlocked();
  }, [searchQuery, blocked]);

  const loadSiteInfo = async () => {
    try {
      const data = await sitesAPI.getById(siteId);
      setCurrentSite(data.site);
    } catch (err) {
      console.error('Load site error:', err);
    }
  };

  const loadBlocked = async () => {
    try {
      setLoading(true);
      const data = await blockedAPI.getBlocked(siteId);
      setBlocked(data.blocked || []);
      setFilteredBlocked(data.blocked || []);
    } catch (err) {
      console.error('Load blocked error:', err);
      toast.error('Ошибка загрузки заблокированных IP');
    } finally {
      setLoading(false);
    }
  };

  const filterBlocked = () => {
    if (!searchQuery) {
      setFilteredBlocked(blocked);
      return;
    }

    const filtered = blocked.filter(item =>
      item.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBlocked(filtered);
  };

  const handleBlockIP = async (e) => {
    e.preventDefault();
    
    try {
      await blockedAPI.blockIP(siteId, newBlock);
      setNewBlock({ ip: '', reason: '', duration: 168 });
      setShowAddModal(false);
      await loadBlocked();
      toast.success(`IP ${newBlock.ip} заблокирован`);
    } catch (err) {
      console.error('Block IP error:', err);
      toast.error('Ошибка блокировки IP');
    }
  };

  const handleUnblock = async (ip) => {
    if (!confirm(`Разблокировать IP ${ip}?`)) return;
    
    try {
      await blockedAPI.unblockIP(siteId, ip);
      await loadBlocked();
      toast.success(`IP ${ip} разблокирован`);
    } catch (err) {
      console.error('Unblock IP error:', err);
      toast.error('Ошибка разблокировки');
    }
  };

  const handleExport = () => {
    if (filteredBlocked.length === 0) {
      toast.warning('Нет данных для экспорта');
      return;
    }
    exportBlockedToCSV(filteredBlocked, currentSite?.name || 'blocked');
    toast.success(`Экспортировано ${filteredBlocked.length} IP`);
  };

  const handleExportForYandex = async () => {
    try {
      const data = await blockedAPI.exportForYandex(siteId);
      const blob = new Blob([data.ips.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blocked-ips-yandex-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Список экспортирован для Яндекс.Директа');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Ошибка экспорта');
    }
  };

  if (!siteId) {
    return (
      <EmptyState
        icon={Shield}
        title="Выберите сайт для управления блокировками"
        description="Используйте выпадающий список в шапке, чтобы выбрать сайт и управлять заблокированными IP адресами."
      />
    );
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.blocked}>
      <div className={styles.header}>
        <div>
          <h1>Заблокированные IP</h1>
          <p>Управление списком заблокированных IP адресов</p>
        </div>
        <div className={styles.actions}>
          {blocked.length > 0 && (
            <>
              <button onClick={handleExport} className={styles.btnSecondary}>
                <Download size={18} />
                Экспорт CSV
              </button>
              <button onClick={handleExportForYandex} className={styles.btnSecondary}>
                <Download size={18} />
                Для Яндекса
              </button>
            </>
          )}
          <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}>
            <Plus size={18} />
            Заблокировать IP
          </button>
        </div>
      </div>

      {blocked.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Нет заблокированных IP адресов"
          description="Отличная новость! Система не обнаружила подозрительной активности. Все клики выглядят легитимными. Вы можете вручную заблокировать IP, если заметите что-то подозрительное."
          action={
            <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}>
              <Plus size={18} />
              Заблокировать IP вручную
            </button>
          }
        />
      ) : (
        <>
          {/* Поиск */}
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Поиск по IP адресу или причине..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <span className={styles.resultsCount}>
                Найдено: {filteredBlocked.length}
              </span>
            )}
          </div>

          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>IP адрес</th>
                  <th>Причина</th>
                  <th>Fraud Score</th>
                  <th>Заблокирован</th>
                  <th>Разблокировка</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlocked.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.noResults}>
                      Ничего не найдено. Попробуйте изменить запрос.
                    </td>
                  </tr>
                ) : (
                  filteredBlocked.map((item, index) => (
                    <tr key={index}>
                      <td><code>{item.ip}</code></td>
                      <td className={styles.reason}>{item.reason}</td>
                      <td>
                        <span className={styles.score}>{item.fraud_score}</span>
                      </td>
                      <td>{new Date(item.blocked_at).toLocaleString('ru')}</td>
                      <td>
                        {item.is_permanent ? (
                          <span className={styles.permanent}>Постоянно</span>
                        ) : (
                          new Date(item.auto_unblock_at).toLocaleString('ru')
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleUnblock(item.ip)}
                          className={styles.btnDanger}
                        >
                          <Trash2 size={16} />
                          Разблокировать
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Модалка добавления блокировки */}
      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Заблокировать IP адрес</h2>
            
            <form onSubmit={handleBlockIP}>
              <div className={styles.formGroup}>
                <label>IP адрес</label>
                <input
                  type="text"
                  placeholder="192.168.1.1"
                  value={newBlock.ip}
                  onChange={(e) => setNewBlock({...newBlock, ip: e.target.value})}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Причина блокировки</label>
                <input
                  type="text"
                  placeholder="Подозрительная активность"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Длительность (часов)</label>
                <select 
                  value={newBlock.duration}
                  onChange={(e) => setNewBlock({...newBlock, duration: parseInt(e.target.value)})}
                >
                  <option value={24}>24 часа</option>
                  <option value={72}>3 дня</option>
                  <option value={168}>7 дней</option>
                  <option value={720}>30 дней</option>
                  <option value={0}>Постоянно</option>
                </select>
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} className={styles.btnCancel}>
                  Отмена
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Заблокировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlockedIPs;