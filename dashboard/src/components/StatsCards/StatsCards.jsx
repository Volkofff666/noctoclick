import styles from './StatsCards.module.css';

function StatsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      title: 'Total Events',
      value: stats.total,
      change: '+12.5%',
      trend: 'up',
      color: 'primary'
    },
    {
      title: 'Legitimate',
      value: stats.legitimate,
      percentage: stats.total > 0 ? ((stats.legitimate / stats.total) * 100).toFixed(1) : 0,
      color: 'success'
    },
    {
      title: 'Suspicious',
      value: stats.suspicious,
      percentage: stats.total > 0 ? ((stats.suspicious / stats.total) * 100).toFixed(1) : 0,
      color: 'warning'
    },
    {
      title: 'Fraudulent',
      value: stats.fraud,
      percentage: stats.total > 0 ? ((stats.fraud / stats.total) * 100).toFixed(1) : 0,
      color: 'danger'
    },
    {
      title: 'Blocked IPs',
      value: stats.blockedIps,
      subtitle: 'Active blocks',
      color: 'info'
    }
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card, index) => (
        <div key={index} className={`${styles.card} ${styles[card.color]}`}>
          <div className={styles.cardHeader}>
            <span className={styles.title}>{card.title}</span>
            {card.change && (
              <span className={`${styles.change} ${styles[card.trend]}`}>
                {card.change}
              </span>
            )}
          </div>
          <div className={styles.cardBody}>
            <div className={styles.value}>{card.value.toLocaleString('en-US')}</div>
            {card.percentage && (
              <div className={styles.percentage}>{card.percentage}% of total</div>
            )}
            {card.subtitle && (
              <div className={styles.subtitle}>{card.subtitle}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;