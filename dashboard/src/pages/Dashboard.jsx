import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, TrendingUp, Shield, AlertTriangle, Activity } from 'lucide-react';
import { sitesAPI, statsAPI } from '../utils/api';
import { useToast } from '../components/Toast/ToastContainer';
import EmptyState from '../components/EmptyState/EmptyState';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('24h');
  const siteId = searchParams.get('site');

  useEffect(() => {
    if (siteId) {
      loadData();
    }
  }, [siteId, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, eventsData] = await Promise.all([
        sitesAPI.getStats(siteId, period),
        statsAPI.getEvents(siteId, { limit: 10 })
      ]);
      setStats(statsData.stats);
      setEvents(eventsData.events || []);
    } catch (err) {
      console.error('Load dashboard data error:', err);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  if (!siteId) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Выберите сайт для просмотра статистики"
        description="Используйте выпадающий список в шапке, чтобы выбрать сайт и увидеть подробную аналитику по защите от скликивания."
      />
    );
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка статистики...</div>;
  }

  const hasNoData = !stats || stats.total === 0;

  if (hasNoData) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <h1>Дашборд</h1>
            <p>Статистика защиты от скликивания за выбранный период</p>
          </div>
          <div className={styles.periodSelector}>
            <button 
              onClick={() => setPeriod('1h')} 
              className={period === '1h' ? styles.active : ''}
            >
              1 час
            </button>
            <button 
              onClick={() => setPeriod('24h')} 
              className={period === '24h' ? styles.active : ''}
            >
              24 часа
            </button>
            <button 
              onClick={() => setPeriod('7d')} 
              className={period === '7d' ? styles.active : ''}
            >
              7 дней
            </button>
            <button 
              onClick={() => setPeriod('30d')} 
              className={period === '30d' ? styles.active : ''}
            >
              30 дней
            </button>
          </div>
        </div>

        <EmptyState
          icon={Activity}
          title="Пока нет данных о событиях"
          description="Трекер установлен, но события ещё не поступали. Откройте ваш сайт и перейдите на любую страницу с рекламой, чтобы начать отслеживание кликов."
        />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1>Дашборд</h1>
          <p>Статистика защиты от скликивания за {period === '1h' ? '1 час' : period === '24h' ? '24 часа' : period === '7d' ? '7 дней' : '30 дней'}</p>
        </div>
        <div className={styles.periodSelector}>
          <button 
            onClick={() => setPeriod('1h')} 
            className={period === '1h' ? styles.active : ''}
          >
            1 час
          </button>
          <button 
            onClick={() => setPeriod('24h')} 
            className={period === '24h' ? styles.active : ''}
          >
            24 часа
          </button>
          <button 
            onClick={() => setPeriod('7d')} 
            className={period === '7d' ? styles.active : ''}
          >
            7 дней
          </button>
          <button 
            onClick={() => setPeriod('30d')} 
            className={period === '30d' ? styles.active : ''}
          >
            30 дней
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <BarChart3 size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Всего событий</div>
            <div className={styles.statValue}>{stats.total.toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Легитимные</div>
            <div className={styles.statValue}>{stats.legitimate.toLocaleString()}</div>
            <div className={styles.statPercent}>
              {((stats.legitimate / stats.total) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Подозрительные</div>
            <div className={styles.statValue}>{stats.suspicious.toLocaleString()}</div>
            <div className={styles.statPercent}>
              {((stats.suspicious / stats.total) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <Shield size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Фрод заблокирован</div>
            <div className={styles.statValue}>{stats.fraud.toLocaleString()}</div>
            <div className={styles.statPercent}>
              {((stats.fraud / stats.total) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Последние события */}
      {events.length > 0 && (
        <div className={styles.section}>
          <h2>Последние события</h2>
          <div className={styles.eventsTable}>
            <table>
              <thead>
                <tr>
                  <th>IP адрес</th>
                  <th>User Agent</th>
                  <th>Статус</th>
                  <th>Fraud Score</th>
                  <th>Время</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td><code>{event.ip}</code></td>
                    <td className={styles.userAgent}>{event.user_agent}</td>
                    <td>
                      <span className={`${styles.badge} ${event.is_fraud ? styles.danger : event.is_suspicious ? styles.warning : styles.success}`}>
                        {event.is_fraud ? 'Фрод' : event.is_suspicious ? 'Подозрительный' : 'Легитимный'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.score}>{event.fraud_score}</span>
                    </td>
                    <td>{new Date(event.created_at).toLocaleString('ru')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;