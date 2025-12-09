import { useState, useEffect } from 'react';
import { statsAPI } from '../utils/api';
import StatsCards from '../components/StatsCards/StatsCards';
import TrafficChart from '../components/TrafficChart/TrafficChart';
import RecentEvents from '../components/RecentEvents/RecentEvents';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siteId, setSiteId] = useState('test-api-key-12345678');
  const [period, setPeriod] = useState('24h');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [siteId, period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statsAPI.getSiteStats(siteId, period);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load statistics. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.controls}>
        <div className={styles.periodSelector}>
          {['1h', '6h', '24h', '7d', '30d'].map(p => (
            <button
              key={p}
              className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.replace('h', ' Hours').replace('d', ' Days')}
            </button>
          ))}
        </div>
        <button onClick={loadStats} className={styles.refreshBtn}>
          <RefreshIcon />
          Refresh
        </button>
      </div>

      {loading && !stats ? (
        <div className={styles.loading}>Loading statistics...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : stats ? (
        <>
          <StatsCards stats={stats.stats} />

          <div className={styles.section}>
            <h2>Traffic Overview</h2>
            <TrafficChart data={stats.hourly} />
          </div>

          <div className={styles.section}>
            <h2>Recent Events</h2>
            <RecentEvents siteId={siteId} />
          </div>

          {stats.topIps && stats.topIps.length > 0 && (
            <div className={styles.section}>
              <h2>Suspicious IP Addresses</h2>
              <div className={styles.ipsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>IP Address</th>
                      <th>Click Count</th>
                      <th>Fraud Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topIps.map((item, index) => (
                      <tr key={index}>
                        <td><code>{item.ip_address}</code></td>
                        <td>{item.click_count}</td>
                        <td>
                          <span className={`${styles.score} ${item.avg_fraud_score > 70 ? styles.scoreDanger : styles.scoreWarning}`}>
                            {Math.round(item.avg_fraud_score)}
                          </span>
                        </td>
                        <td>
                          {item.is_fraud ? (
                            <span className={styles.badgeDanger}>Fraud</span>
                          ) : (
                            <span className={styles.badgeWarning}>Suspicious</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default Dashboard;