import styles from './EmptyState.module.css';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className={styles.emptyState}>
      <div className={styles.icon}>
        {Icon && <Icon size={64} strokeWidth={1.5} />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <div className={styles.action}>
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;