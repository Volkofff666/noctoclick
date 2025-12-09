import { useState, useEffect } from 'react';
import { blockedAPI } from '../utils/api';
import styles from './BlockedIPs.module.css';

function BlockedIPs() {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteId] = useState('test-api-key-12345678');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');

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
    if (!confirm(`Разблокировать IP ${ip}?`)) return;

    try {
      await blockedAPI.unblockIP(siteId, ip);
      await loadBlocked();
    } catch (err) {
      console.error('Failed to unblock IP:', err);
      alert('Ошибка разблокировки');
    }
  };

  const handleAddIP = async (e) => {
    e.preventDefault();
    
    try {
      await blockedAPI.blockIP(siteId, {
        ip: newIP,
        reason: newReason || 'Ручная блокировка',
        autoDuration: 168 // 7 days
      });
      
      setNewIP('');
      setNewReason('');
      setShowAddModal(false);
      await loadBlocked();
    } catch (err) {
      console.error('Failed to block IP:', err);
      alert('Ошибка блокировки');
    }
  };

  const handleExport = async () => {
    try {
      const data = await blockedAPI.exportForYandex(siteId);
      const text = data.ips.join('\n');
      
      // Copy to clipboard
      await navigator.clipboard.writeText(text);
      alert(`Скопировано ${data.ips.length} IP адресов в буфер обмена`);
    } catch (err) {
      console.error('Failed to export:', err);
      alert('Ошибка экспорта');
    }
  };

  return (
    <div className={styles.blocked}>
      <div className={styles.header}>
        <div>
          <h2>Заблокированные IP</h2>
          <p className={styles.subtitle}>Всего: {blocked.length}</p>
        </div>
        <div className={styles.actions}>
          <button onClick={handleExport} className={styles.btnSecondary}>
            📎 Экспорт для Yandex
          </button>
          <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}>
            + Добавить IP
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : blocked.length === 0 ? (
        <div className={styles.empty}>
          <p>Нет заблокированных IP</p>
        </div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>IP адрес</th>
                <th>Причина</th>
                <th>Тип</th>
                <th>Дата блокировки</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {blocked.map((item) => (
                <tr key={item.id}>
                  <td><code>{item.ip_address}</code></td>
                  <td>{item.reason}</td>
                  <td>
                    <span className={`${styles.badge} ${item.auto_blocked ? styles.badgeAuto : styles.badgeManual}`}>
                      {item.auto_blocked ? 'Авто' : 'Ручной'}
                    </span>
                  </td>
                  <td>{new Date(item.blocked_at).toLocaleString('ru')}</td>
                  <td>
                    <button 
                      onClick={() => handleUnblock(item.ip_address)}
                      className={styles.btnDanger}
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

      {/* Add IP Modal */}
      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Добавить IP в блокировку</h3>
            <form onSubmit={handleAddIP}>
              <div className={styles.formGroup}>
                <label>IP адрес</label>
                <input
                  type="text"
                  placeholder="192.168.1.1"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Причина (опционально)</label>
                <textarea
                  placeholder="Причина блокировки"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} className={styles.btnSecondary}>
                  Отмена
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Добавить
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