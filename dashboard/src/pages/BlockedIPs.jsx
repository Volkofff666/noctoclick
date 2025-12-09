import { useState, useEffect } from 'react';
import { Download, Plus, Search, X } from 'lucide-react';
import { blockedAPI } from '../utils/api';
import styles from './BlockedIPs.module.css';

function BlockedIPs() {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteId] = useState('test-api-key-12345678');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBlocked();
  }, []);

  const loadBlocked = async () => {
    try {
      setLoading(true);
      const data = await blockedAPI.getBlocked(siteId);
      setBlocked(data.blocked || []);
    } catch (err) {
      console.error('Failed to load blocked IPs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (ip) => {
    if (!confirm(`Вы уверены, что хотите разблокировать ${ip}?`)) return;

    try {
      await blockedAPI.unblockIP(siteId, ip);
      await loadBlocked();
    } catch (err) {
      console.error('Failed to unblock IP:', err);
      alert('Ошибка разблокировки. Попробуйте снова.');
    }
  };

  const handleAddIP = async (e) => {
    e.preventDefault();
    
    try {
      await blockedAPI.blockIP(siteId, {
        ip: newIP,
        reason: newReason || 'Ручная блокировка',
        autoDuration: 168
      });
      
      setNewIP('');
      setNewReason('');
      setShowAddModal(false);
      await loadBlocked();
    } catch (err) {
      console.error('Failed to block IP:', err);
      alert('Ошибка блокировки. Попробуйте снова.');
    }
  };

  const handleExport = async () => {
    try {
      const data = await blockedAPI.exportForYandex(siteId);
      const text = data.ips.join('\n');
      
      await navigator.clipboard.writeText(text);
      alert(`Скопировано ${data.ips.length} IP-адресов в буфер обмена`);
    } catch (err) {
      console.error('Failed to export:', err);
      alert('Ошибка экспорта');
    }
  };

  const filteredBlocked = blocked.filter(item => {
    if (filterType === 'auto' && !item.auto_blocked) return false;
    if (filterType === 'manual' && item.auto_blocked) return false;
    if (searchQuery && !item.ip_address.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className={styles.blocked}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{blocked.length}</span>
              <span className={styles.statLabel}>Всего заблокировано</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{blocked.filter(b => b.auto_blocked).length}</span>
              <span className={styles.statLabel}>Автоматически</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{blocked.filter(b => !b.auto_blocked).length}</span>
              <span className={styles.statLabel}>Вручную</span>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleExport} className={styles.btnSecondary}>
            <Download size={16} />
            Экспорт для Яндекса
          </button>
          <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}>
            <Plus size={16} />
            Добавить IP
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filterType === 'all' ? styles.active : ''}`}
            onClick={() => setFilterType('all')}
          >
            Все
          </button>
          <button 
            className={`${styles.filterBtn} ${filterType === 'auto' ? styles.active : ''}`}
            onClick={() => setFilterType('auto')}
          >
            Автоматические
          </button>
          <button 
            className={`${styles.filterBtn} ${filterType === 'manual' ? styles.active : ''}`}
            onClick={() => setFilterType('manual')}
          >
            Ручные
          </button>
        </div>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по IP-адресу..."
            className={styles.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка заблокированных IP...</div>
      ) : filteredBlocked.length === 0 ? (
        <div className={styles.empty}>
          <Shield size={48} />
          <p>Нет заблокированных IP-адресов{searchQuery ? ' по вашему запросу' : ''}</p>
        </div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>IP адрес</th>
                <th>Причина</th>
                <th>Тип</th>
                <th>Заблокирован</th>
                <th>Авто-разблокировка</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlocked.map((item) => (
                <tr key={item.id}>
                  <td><code className={styles.ipCode}>{item.ip_address}</code></td>
                  <td className={styles.reason}>{item.reason}</td>
                  <td>
                    <span className={`${styles.badge} ${item.auto_blocked ? styles.badgeAuto : styles.badgeManual}`}>
                      {item.auto_blocked ? 'Авто' : 'Ручной'}
                    </span>
                  </td>
                  <td className={styles.date}>{new Date(item.blocked_at).toLocaleString('ru')}</td>
                  <td className={styles.date}>
                    {item.auto_unblock_at ? new Date(item.auto_unblock_at).toLocaleString('ru') : '—'}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleUnblock(item.ip_address)}
                      className={styles.btnUnblock}
                    >
                      Разблокировать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Заблокировать IP-адрес</h3>
              <button onClick={() => setShowAddModal(false)} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddIP}>
              <div className={styles.formGroup}>
                <label>IP адрес</label>
                <input
                  type="text"
                  placeholder="192.168.1.1"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  required
                  pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                />
                <small>Введите корректный IPv4 адрес</small>
              </div>
              <div className={styles.formGroup}>
                <label>Причина (необязательно)</label>
                <textarea
                  placeholder="Причина блокировки IP-адреса"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  rows={3}
                />
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