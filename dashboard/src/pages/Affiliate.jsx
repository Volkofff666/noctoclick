import { useState, useEffect } from 'react';
import { Users, Copy, DollarSign, TrendingUp, Link as LinkIcon, Gift, CheckCircle, ExternalLink } from 'lucide-react';
import { affiliateAPI } from '../utils/api';
import { useToast } from '../components/Toast/ToastContainer';
import styles from './Affiliate.module.css';

function Affiliate() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('card');

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);
      const [statsData, referralsData, earningsData] = await Promise.all([
        affiliateAPI.getStats(),
        affiliateAPI.getReferrals(),
        affiliateAPI.getEarnings()
      ]);
      
      setStats(statsData.stats);
      setReferrals(referralsData.referrals || []);
      setEarnings(earningsData.earnings || []);
      setReferralCode(statsData.referralCode);
    } catch (err) {
      console.error('Load affiliate data error:', err);
      toast.error('Ошибка загрузки данных партнёрской программы');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `https://noctoclick.ru/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Реферальная ссылка скопирована!');
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Реферальный код скопирован!');
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    
    if (parseFloat(payoutAmount) < 1000) {
      toast.error('Минимальная сумма для вывода - 1000₽');
      return;
    }

    if (parseFloat(payoutAmount) > stats.availableBalance) {
      toast.error('Недостаточно средств на балансе');
      return;
    }

    try {
      await affiliateAPI.requestPayout({
        amount: parseFloat(payoutAmount),
        method: payoutMethod
      });
      toast.success('Заявка на вывод отправлена! Средства поступят в течение 3-5 рабочих дней.');
      setShowPayoutModal(false);
      setPayoutAmount('');
      await loadAffiliateData();
    } catch (err) {
      console.error('Request payout error:', err);
      toast.error('Ошибка создания заявки на вывод');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  const referralLink = `https://noctoclick.ru/register?ref=${referralCode}`;

  return (
    <div className={styles.affiliate}>
      <div className={styles.header}>
        <div>
          <h1>Партнёрская программа</h1>
          <p>Получайте 30% от платежей ваших рефералов ежемесячно</p>
        </div>
      </div>

      {/* Статистика */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Всего рефералов</div>
            <div className={styles.statValue}>{stats?.totalReferrals || 0}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Активные рефералы</div>
            <div className={styles.statValue}>{stats?.activeReferrals || 0}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Доступно к выводу</div>
            <div className={styles.statValue}>{(stats?.availableBalance || 0).toLocaleString()}₽</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Всего заработано</div>
            <div className={styles.statValue}>{(stats?.totalEarned || 0).toLocaleString()}₽</div>
          </div>
        </div>
      </div>

      {/* Условия программы */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Как это работает?</h2>
        </div>
        <div className={styles.howItWorksGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <h3>Делитесь ссылкой</h3>
            <p>Приглашайте друзей, коллег и клиентов по вашей реферальной ссылке</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <h3>Они регистрируются</h3>
            <p>Ваш реферал создаёт аккаунт и начинает пользоваться сервисом</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <h3>Получаете 30%</h3>
            <p>С каждого их платежа вы получаете 30% комиссии, пока они пользуются сервисом</p>
          </div>
        </div>

        <div className={styles.benefits}>
          <h3><Gift size={20} /> Преимущества программы:</h3>
          <ul>
            <li>💰 <strong>30% от каждого платежа</strong> реферала ежемесячно</li>
            <li>🔄 <strong>Пожизненные выплаты</strong> - получайте комиссию, пока реферал пользуется сервисом</li>
            <li>💳 <strong>Минимальный вывод 1000₽</strong> на карту или электронный кошелёк</li>
            <li>📊 <strong>Прозрачная статистика</strong> - отслеживайте рефералов и доходы в реальном времени</li>
            <li>⚡ <strong>Быстрые выплаты</strong> - получайте деньги в течение 3-5 рабочих дней</li>
            <li>🎁 <strong>Бонусы за активность</strong> - чем больше рефералов, тем выше комиссия</li>
          </ul>
        </div>
      </div>

      {/* Реферальная ссылка */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Ваша реферальная ссылка</h2>
        </div>
        
        <div className={styles.referralBox}>
          <div className={styles.referralLinkBox}>
            <LinkIcon size={20} />
            <input 
              type="text" 
              value={referralLink} 
              readOnly 
              className={styles.referralInput}
            />
            <button onClick={copyReferralLink} className={styles.btnCopy}>
              <Copy size={16} />
              Скопировать
            </button>
          </div>

          <div className={styles.referralCodeBox}>
            <span className={styles.codeLabel}>Или используйте промокод:</span>
            <div className={styles.codeValue}>
              <code>{referralCode}</code>
              <button onClick={copyReferralCode} className={styles.btnCopySmall}>
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.shareButtons}>
          <button className={styles.btnShare} style={{ background: '#0088cc' }}>
            <ExternalLink size={16} />
            Поделиться в Telegram
          </button>
          <button className={styles.btnShare} style={{ background: '#1877f2' }}>
            <ExternalLink size={16} />
            Поделиться в VK
          </button>
          <button className={styles.btnShare} style={{ background: '#25D366' }}>
            <ExternalLink size={16} />
            Поделиться в WhatsApp
          </button>
        </div>
      </div>

      {/* Список рефералов */}
      {referrals.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Ваши рефералы ({referrals.length})</h2>
          </div>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Дата регистрации</th>
                  <th>Статус</th>
                  <th>Платежей</th>
                  <th>Ваш доход</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral, index) => (
                  <tr key={index}>
                    <td>{referral.email}</td>
                    <td>{new Date(referral.registeredAt).toLocaleDateString('ru')}</td>
                    <td>
                      <span className={`${styles.badge} ${referral.isActive ? styles.success : styles.inactive}`}>
                        {referral.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td>{referral.totalPayments}</td>
                    <td className={styles.earnings}>+{referral.yourEarnings.toLocaleString()}₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* История выплат */}
      {earnings.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>История начислений</h2>
            <button 
              onClick={() => setShowPayoutModal(true)} 
              className={styles.btnPrimary}
              disabled={!stats?.availableBalance || stats.availableBalance < 1000}
            >
              <DollarSign size={16} />
              Вывести средства
            </button>
          </div>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>От реферала</th>
                  <th>Тип</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((earning, index) => (
                  <tr key={index}>
                    <td>{new Date(earning.date).toLocaleDateString('ru')}</td>
                    <td>{earning.referralEmail}</td>
                    <td>{earning.type === 'commission' ? 'Комиссия 30%' : 'Вывод'}</td>
                    <td className={earning.type === 'commission' ? styles.positive : styles.negative}>
                      {earning.type === 'commission' ? '+' : '-'}{earning.amount.toLocaleString()}₽
                    </td>
                    <td>
                      <span className={`${styles.badge} ${earning.status === 'completed' ? styles.success : earning.status === 'pending' ? styles.warning : styles.inactive}`}>
                        {earning.status === 'completed' ? 'Выплачено' : earning.status === 'pending' ? 'В обработке' : 'Отменено'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {referrals.length === 0 && (
        <div className={styles.emptyState}>
          <Users size={64} />
          <h3>У вас пока нет рефералов</h3>
          <p>Начните приглашать пользователей по вашей реферальной ссылке и получайте 30% от их платежей!</p>
        </div>
      )}

      {/* Модалка вывода средств */}
      {showPayoutModal && (
        <div className={styles.modal} onClick={() => setShowPayoutModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Вывод средств</h2>
            <p className={styles.modalSubtitle}>
              Доступно к выводу: <strong>{stats.availableBalance.toLocaleString()}₽</strong>
            </p>
            
            <form onSubmit={handleRequestPayout}>
              <div className={styles.formGroup}>
                <label>Сумма вывода (минимум 1000₽)</label>
                <input
                  type="number"
                  placeholder="Введите сумму"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  min="1000"
                  max={stats.availableBalance}
                  step="100"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Способ вывода</label>
                <select 
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                >
                  <option value="card">Банковская карта</option>
                  <option value="yoomoney">ЮMoney</option>
                  <option value="qiwi">QIWI</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              <div className={styles.payoutInfo}>
                <p>💡 Средства поступят в течение 3-5 рабочих дней</p>
                <p>📧 Мы отправим уведомление на вашу почту после обработки заявки</p>
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowPayoutModal(false)} className={styles.btnCancel}>
                  Отмена
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  Отправить заявку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Affiliate;