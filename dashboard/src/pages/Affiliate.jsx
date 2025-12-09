import { useState, useEffect } from 'react';
import { Users, Copy, DollarSign, TrendingUp, Link as LinkIcon, Gift, CheckCircle, ExternalLink, Clock, CreditCard, Calendar, Award, BarChart3 } from 'lucide-react';
import { affiliateAPI } from '../utils/api';
import { useToast } from '../components/Toast/ToastContainer';
import LineChart from '../components/Charts/LineChart';
import styles from './Affiliate.module.css';

function Affiliate() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [earningsChart, setEarningsChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('card');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);
      const [statsData, referralsData, earningsData, chartData] = await Promise.all([
        affiliateAPI.getStats(),
        affiliateAPI.getReferrals(),
        affiliateAPI.getEarnings(),
        affiliateAPI.getEarningsChart()
      ]);
      
      setStats(statsData.stats);
      setReferrals(referralsData.referrals || []);
      setEarnings(earningsData.earnings || []);
      setEarningsChart(chartData.data || []);
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
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>💰 Партнёрская программа</h1>
          <p>Зарабатывайте 30% от каждого платежа ваших рефералов пожизненно</p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStatItem}>
            <span className={styles.heroStatValue}>{stats?.totalReferrals || 0}</span>
            <span className={styles.heroStatLabel}>Рефералов</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStatItem}>
            <span className={styles.heroStatValue}>{(stats?.totalEarned || 0).toLocaleString()}₽</span>
            <span className={styles.heroStatLabel}>Заработано</span>
          </div>
        </div>
      </div>

      {/* Финансовая панель */}
      <div className={styles.financePanel}>
        <div className={styles.financeCard}>
          <div className={styles.financeHeader}>
            <div className={styles.financeIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <DollarSign size={24} />
            </div>
            <div className={styles.financeInfo}>
              <div className={styles.financeLabel}>Доступно к выводу</div>
              <div className={styles.financeValue}>{(stats?.availableBalance || 0).toLocaleString()}₽</div>
            </div>
          </div>
          <button 
            onClick={() => setShowPayoutModal(true)} 
            className={styles.btnWithdraw}
            disabled={!stats?.availableBalance || stats.availableBalance < 1000}
          >
            <CreditCard size={16} />
            Вывести средства
          </button>
        </div>

        <div className={styles.financeCard}>
          <div className={styles.financeHeader}>
            <div className={styles.financeIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className={styles.financeInfo}>
              <div className={styles.financeLabel}>В холде (ожидание)</div>
              <div className={styles.financeValue}>{(stats?.onHold || 0).toLocaleString()}₽</div>
            </div>
          </div>
          <div className={styles.financeNote}>
            <span>💡 Средства поступят через {stats?.holdDays || 7} дней</span>
          </div>
        </div>

        <div className={styles.financeCard}>
          <div className={styles.financeHeader}>
            <div className={styles.financeIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Calendar size={24} />
            </div>
            <div className={styles.financeInfo}>
              <div className={styles.financeLabel}>Заработано за месяц</div>
              <div className={styles.financeValue}>{(stats?.monthlyEarnings || 0).toLocaleString()}₽</div>
            </div>
          </div>
          <div className={styles.financeProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${Math.min((stats?.monthlyEarnings / stats?.monthlyGoal) * 100, 100)}%` }}
              />
            </div>
            <span>Цель: {(stats?.monthlyGoal || 10000).toLocaleString()}₽</span>
          </div>
        </div>

        <div className={styles.financeCard}>
          <div className={styles.financeHeader}>
            <div className={styles.financeIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Award size={24} />
            </div>
            <div className={styles.financeInfo}>
              <div className={styles.financeLabel}>Рейтинг партнёра</div>
              <div className={styles.financeValue}>{stats?.partnerLevel || 'Новичок'}</div>
            </div>
          </div>
          <div className={styles.levelBadges}>
            <span className={`${styles.levelBadge} ${stats?.totalEarned >= 10000 ? styles.active : ''}`}>🥉 Бронза</span>
            <span className={`${styles.levelBadge} ${stats?.totalEarned >= 50000 ? styles.active : ''}`}>🥈 Серебро</span>
            <span className={`${styles.levelBadge} ${stats?.totalEarned >= 100000 ? styles.active : ''}`}>🥇 Золото</span>
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
        >
          <BarChart3 size={18} />
          Обзор
        </button>
        <button 
          onClick={() => setActiveTab('referrals')} 
          className={`${styles.tab} ${activeTab === 'referrals' ? styles.active : ''}`}
        >
          <Users size={18} />
          Рефералы ({referrals.length})
        </button>
        <button 
          onClick={() => setActiveTab('earnings')} 
          className={`${styles.tab} ${activeTab === 'earnings' ? styles.active : ''}`}
        >
          <TrendingUp size={18} />
          История ({earnings.length})
        </button>
      </div>

      {/* Контент табов */}
      {activeTab === 'overview' && (
        <div className={styles.tabContent}>
          {/* График доходов */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>📈 Динамика доходов</h2>
            </div>
            <LineChart 
              data={earningsChart}
              title="Заработок за последние 30 дней"
            />
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
                <TrendingUp size={24} />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Конверсия</div>
                <div className={styles.statValue}>{((stats?.activeReferrals / stats?.totalReferrals) * 100 || 0).toFixed(1)}%</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                <DollarSign size={24} />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Средний доход с реферала</div>
                <div className={styles.statValue}>{((stats?.totalEarned / stats?.activeReferrals) || 0).toLocaleString()}₽</div>
              </div>
            </div>
          </div>

          {/* Как это работает */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>🎯 Как работает партнёрская программа?</h2>
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
          </div>

          {/* Реферальная ссылка */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>🔗 Ваша реферальная ссылка</h2>
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
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className={styles.tabContent}>
          {referrals.length > 0 ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>👥 Ваши рефералы ({referrals.length})</h2>
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
          ) : (
            <div className={styles.emptyState}>
              <Users size={64} />
              <h3>У вас пока нет рефералов</h3>
              <p>Начните приглашать пользователей по вашей реферальной ссылке и получайте 30% от их платежей!</p>
              <button onClick={() => setActiveTab('overview')} className={styles.btnPrimary}>
                Получить ссылку
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className={styles.tabContent}>
          {earnings.length > 0 ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>💸 История начислений</h2>
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
          ) : (
            <div className={styles.emptyState}>
              <DollarSign size={64} />
              <h3>История начислений пуста</h3>
              <p>Здесь будут отображаться все ваши комиссии и выплаты</p>
            </div>
          )}
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