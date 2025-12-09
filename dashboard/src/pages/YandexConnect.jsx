import { useState } from 'react';
import { Link2, CheckCircle, RefreshCw, Info } from 'lucide-react';
import styles from './YandexConnect.module.css';

function YandexConnect() {
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState(null);

  const handleConnect = () => {
    // TODO: Implement Yandex OAuth
    alert('Интеграция с Яндекс OAuth будет реализована в следующей версии');
  };

  const handleSync = () => {
    alert('Синхронизация с Яндекс.Директ...');
  };

  return (
    <div className={styles.yandex}>
      <div className={styles.hero}>
        <div className={styles.heroIcon}>
          <Link2 size={64} strokeWidth={1.5} />
        </div>
        <h2>Интеграция с Яндекс.Директ</h2>
        <p>
          Подключите NoctoClick к вашим рекламным кампаниям в Яндекс.Директ
          для автоматической блокировки мошеннических IP-адресов.
        </p>
      </div>

      {!connected ? (
        <div className={styles.section}>
          <h3>Как это работает?</h3>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>Подключение аккаунта</h4>
                <p>Авторизуйтесь через Яндекс OAuth для доступа к API</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>Выбор кампаний</h4>
                <p>Выберите кампании, которые нужно защитить от скликивания</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4>Автоматическая блокировка</h4>
                <p>Система будет автоматически блокировать мошеннические IP через Яндекс.Метрику</p>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={handleConnect} className={styles.btnPrimary}>
              <Link2 size={18} />
              Подключить Яндекс.Директ
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.section}>
          <div className={styles.connected}>
            <div className={styles.connectedIcon}>
              <CheckCircle size={48} strokeWidth={2} />
            </div>
            <div>
              <h3>Аккаунт подключен</h3>
              <p>Ваш аккаунт успешно подключен к NoctoClick</p>
            </div>
          </div>

          <div className={styles.campaigns}>
            <h3>Ваши кампании</h3>
            <p className={styles.subtitle}>Список кампаний будет доступен после подключения</p>
          </div>

          <div className={styles.actions}>
            <button onClick={handleSync} className={styles.btnPrimary}>
              <RefreshCw size={18} />
              Синхронизировать сейчас
            </button>
          </div>
        </div>
      )}

      <div className={styles.info}>
        <h3>
          <Info size={20} />
          Важная информация
        </h3>
        <ul>
          <li>Яндекс.Директ ограничивает блокировку до 25 IP-адресов на кампанию</li>
          <li>Блокировка осуществляется через Яндекс.Метрику с корректировкой ставок -100%</li>
          <li>Синхронизация происходит автоматически каждый час</li>
          <li>Вы можете отключить интеграцию в любой момент</li>
        </ul>
      </div>
    </div>
  );
}

export default YandexConnect;