import { useState } from 'react';
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

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  return (
    <div className={styles.settings}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Fraud Detection Thresholds</h2>
          <p>Configure sensitivity and rules for detecting fraudulent activity</p>
        </div>
        
        <form onSubmit={handleSave}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                Maximum Clicks Per Hour
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
              <small>Number of clicks from single IP per hour before flagging as suspicious</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Minimum Time on Site (seconds)
                <span className={styles.badge}>{settings.minTimeOnSite}s</span>
              </label>
              <input
                type="range"
                value={settings.minTimeOnSite}
                onChange={(e) => setSettings({...settings, minTimeOnSite: parseInt(e.target.value)})}
                min="1"
                max="30"
                className={styles.slider}
              />
              <small>Minimum time for legitimate visit detection</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Fraud Score Threshold
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
              <small>Threshold score for automatic IP blocking</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Auto-block Duration (hours)
                <span className={styles.badge}>{settings.blockDuration}h</span>
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
              <small>How long IPs remain blocked ({Math.floor(settings.blockDuration / 24)} days)</small>
            </div>

            <div className={styles.formGroup}>
              <label>
                Sync Interval (minutes)
                <span className={styles.badge}>{settings.syncInterval}m</span>
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
              <small>Frequency of synchronization with Yandex Direct</small>
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
                  <span className={styles.toggleTitle}>Automatic IP Blocking</span>
                  <span className={styles.toggleDesc}>Enable automatic blocking of fraudulent IP addresses</span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            {saved && (
              <span className={styles.savedMessage}>
                <CheckIcon />
                Settings saved successfully
              </span>
            )}
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>System Information</h2>
          <p>Current system status and configuration</p>
        </div>
        
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Version</div>
            <div className={styles.infoValue}>1.0.0</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>API Endpoint</div>
            <div className={styles.infoValue}>
              <code>{import.meta.env.VITE_API_URL || '/api'}</code>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Status</div>
            <div className={styles.infoValue}>
              <span className={styles.statusBadge}>
                <span className={styles.statusDot}></span>
                Active
              </span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Environment</div>
            <div className={styles.infoValue}>
              {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Danger Zone</h2>
          <p>Irreversible and destructive actions</p>
        </div>
        
        <div className={styles.dangerZone}>
          <div className={styles.dangerItem}>
            <div>
              <div className={styles.dangerTitle}>Clear All Blocked IPs</div>
              <div className={styles.dangerDesc}>Remove all IP addresses from the block list</div>
            </div>
            <button className={styles.btnDanger}>Clear All</button>
          </div>
          <div className={styles.dangerItem}>
            <div>
              <div className={styles.dangerTitle}>Reset Statistics</div>
              <div className={styles.dangerDesc}>Delete all event data and statistics</div>
            </div>
            <button className={styles.btnDanger}>Reset Data</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;