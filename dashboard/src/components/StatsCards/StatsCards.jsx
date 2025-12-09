import styles from './StatsCards.module.css';

function StatsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      title: 'Всего кликов',
      value: stats.total,
      icon: '👆',
      color: 'primary'
    },
    {
      title: 'Легитимные',
      value: stats.legitimate,
      icon: '✅',
      color: 'success'
    },
    {
      title: 'Подозрительные',
      value: stats.suspicious,
      icon: '⚠️',
      color: 'warning'
    },
    {
      title: 'Фродовые',
      value: stats.fraud,
      icon: '🚨',
      color: 'danger'
    },
    {
      title: 'Заблокировано IP',
      value: stats.blockedIps,
      icon: '🚫',
      color: 'info'
    }
  ];

  const fraudRate = stats.total > 0 
    ? ((stats.fraud / stats.total) * 100).toFixed(1)
    : 0;

  return (
    <div className={styles.container}>
      {cards.map((card, index) => (
        <div key={index} className={`${styles.card} ${styles[card.color]}`}>
          <div className={styles.icon}>{card.icon}</div>
          <div className={styles.content}>
            <div className={styles.title}>{card.title}</div>
            <div className={styles.value}>{card.value.toLocaleString('ru')}</div>
            {card.title === 'Фродовые' && (
              <div className={styles.rate}>{fraudRate}% от всего трафика</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;