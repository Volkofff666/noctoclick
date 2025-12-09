import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
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
      setError('Ошибка загрузки данных. Проверьте подключение к серверу.');
    } finally {
      setLoading(false);
    }
  };

  const periodLabels = {
    '1h': '1 час',
    '6h': '6 часов',
    '24h': '24 часа',
    '7d': '7 дней',
    '30d': '30 дней'
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.controls}>
        <div className={styles.periodSelector}>
          {Object.keys(periodLabels).map(p => (
            <button
              key={p}
              className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
        <button onClick={loadStats} className={styles.refreshBtn}>
          <RefreshCw size={16} />
          Обновить
        </button>
      </div>

      {loading && !stats ? (
        <div className={styles.loading}>Загрузка статистики...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : stats ? (
        <>
          <StatsCards stats={stats.stats} />

          <div className={styles.section}>
            <h2>График трафика</h2>
            <TrafficChart data={stats.hourly} />
          </div>

          <div className={styles.section}>
            <h2>Последние события</h2>
            <RecentEvents siteId={siteId} />
          </div>

          {stats.topIps && stats.topIps.length > 0 && (
            <div className={styles.section}>
              <h2>Подозрительные IP-адреса</h2>
              <div className={styles.ipsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>IP адрес</th>
                      <th>Количество кликов</th>
                      <th>Fraud Score</th>
                      <th>Статус</th>
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
                            <span className={styles.badgeDanger}>Фрод</span>
                          ) : (
                            <span className={styles.badgeWarning}>Подозрительный</span>
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