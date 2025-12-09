import { useState, useEffect } from 'react';
import { statsAPI } from '../../utils/api';
import styles from './RecentEvents.module.css';

function RecentEvents({ siteId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [siteId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await statsAPI.getRecentEvents(siteId, 20);
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (events.length === 0) {
    return <div className={styles.empty}>Нет событий</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {events.map((event) => (
          <div key={event.id} className={`${styles.event} ${event.is_fraud ? styles.fraud : event.is_suspicious ? styles.suspicious : ''}`}>
            <div className={styles.eventHeader}>
              <code className={styles.ip}>{event.ip_address}</code>
              <span className={styles.time}>
                {new Date(event.created_at).toLocaleTimeString('ru')}
              </span>
            </div>
            <div className={styles.eventBody}>
              <div className={styles.url}>{event.url}</div>
              <div className={styles.meta}>
                <span>⏱ {event.time_on_page}с</span>
                <span className={`${styles.score} ${event.fraud_score > 70 ? styles.scoreHigh : event.fraud_score > 40 ? styles.scoreMed : styles.scoreLow}`}>
                  Score: {event.fraud_score}
                </span>
                {event.fraud_reason && (
                  <span className={styles.reason} title={event.fraud_reason}>
                    ⚠️ {event.fraud_reason.split(';')[0]}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentEvents;