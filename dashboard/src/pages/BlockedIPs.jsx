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
    if (!confirm(`Are you sure you want to unblock ${ip}?`)) return;

    try {
      await blockedAPI.unblockIP(siteId, ip);
      await loadBlocked();
    } catch (err) {
      console.error('Failed to unblock IP:', err);
      alert('Failed to unblock IP. Please try again.');
    }
  };

  const handleAddIP = async (e) => {
    e.preventDefault();
    
    try {
      await blockedAPI.blockIP(siteId, {
        ip: newIP,
        reason: newReason || 'Manual block',
        autoDuration: 168
      });
      
      setNewIP('');
      setNewReason('');
      setShowAddModal(false);
      await loadBlocked();
    } catch (err) {
      console.error('Failed to block IP:', err);
      alert('Failed to block IP. Please try again.');
    }
  };

  const handleExport = async () => {
    try {
      const data = await blockedAPI.exportForYandex(siteId);
      const text = data.ips.join('\n');
      
      await navigator.clipboard.writeText(text);
      alert(`${data.ips.length} IP addresses copied to clipboard`);
    } catch (err) {
      console.error('Failed to export:', err);
      alert('Failed to export IPs');
    }
  };

  const filteredBlocked = blocked.filter(item => {
    if (filterType === 'auto' && !item.auto_blocked) return false;
    if (filterType === 'manual' && item.auto_blocked) return false;
    if (searchQuery && !item.ip_address.includes(searchQuery)) return false;
    return true;
  });

  const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );

  const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  return (
    <div className={styles.blocked}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{blocked.length}</span>
              <span className={styles.statLabel}>Total Blocked</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{blocked.filter(b => b.auto_blocked).length}</span>
              <span className={styles.statLabel}>Auto-blocked</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{blocked.filter(b => !b.auto_blocked).length}</span>
              <span className={styles.statLabel}>Manual</span>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleExport} className={styles.btnSecondary}>
            <DownloadIcon />
            Export for Yandex
          </button>
          <button onClick={() => setShowAddModal(true)} className={styles.btnPrimary}>
            <PlusIcon />
            Add IP
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filterType === 'all' ? styles.active : ''}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button 
            className={`${styles.filterBtn} ${filterType === 'auto' ? styles.active : ''}`}
            onClick={() => setFilterType('auto')}
          >
            Auto-blocked
          </button>
          <button 
            className={`${styles.filterBtn} ${filterType === 'manual' ? styles.active : ''}`}
            onClick={() => setFilterType('manual')}
          >
            Manual
          </button>
        </div>
        <input
          type="text"
          placeholder="Search IP address..."
          className={styles.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading blocked IPs...</div>
      ) : filteredBlocked.length === 0 ? (
        <div className={styles.empty}>
          <ShieldIcon />
          <p>No blocked IP addresses{searchQuery ? ' matching your search' : ''}</p>
        </div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Reason</th>
                <th>Type</th>
                <th>Blocked At</th>
                <th>Auto-unblock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlocked.map((item) => (
                <tr key={item.id}>
                  <td><code className={styles.ipCode}>{item.ip_address}</code></td>
                  <td className={styles.reason}>{item.reason}</td>
                  <td>
                    <span className={`${styles.badge} ${item.auto_blocked ? styles.badgeAuto : styles.badgeManual}`}>
                      {item.auto_blocked ? 'Automatic' : 'Manual'}
                    </span>
                  </td>
                  <td className={styles.date}>{new Date(item.blocked_at).toLocaleString('en-US')}</td>
                  <td className={styles.date}>
                    {item.auto_unblock_at ? new Date(item.auto_unblock_at).toLocaleString('en-US') : '—'}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleUnblock(item.ip_address)}
                      className={styles.btnUnblock}
                    >
                      Unblock
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
              <h3>Block IP Address</h3>
              <button onClick={() => setShowAddModal(false)} className={styles.modalClose}>×</button>
            </div>
            <form onSubmit={handleAddIP}>
              <div className={styles.formGroup}>
                <label>IP Address</label>
                <input
                  type="text"
                  placeholder="192.168.1.1"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  required
                  pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                />
                <small>Enter a valid IPv4 address</small>
              </div>
              <div className={styles.formGroup}>
                <label>Reason (optional)</label>
                <textarea
                  placeholder="Reason for blocking this IP address"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Block IP
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