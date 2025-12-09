import { useState } from 'react';
import { CheckCircle, Copy, ArrowRight, PlayCircle, BookOpen, Zap, Shield, TrendingUp } from 'lucide-react';
import { useToast } from '../components/Toast/ToastContainer';
import styles from './GettingStarted.module.css';

function GettingStarted() {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    {
      id: 1,
      title: 'Добавьте ваш сайт',
      icon: PlayCircle,
      duration: '2 минуты',
      description: 'Первый шаг - добавить сайт, который вы хотите защитить от скликивания',
      content: [
        'Перейдите в раздел "Мои сайты"',
        'Нажмите кнопку "Добавить сайт"',
        'Введите название сайта (например: "Мой интернет-магазин")',
        'Укажите домен без http:// и www. (например: example.com)',
        'Нажмите "Добавить" - сайт будет создан, и вы получите уникальный API ключ'
      ]
    },
    {
      id: 2,
      title: 'Установите трекер',
      icon: BookOpen,
      duration: '5 минут',
      description: 'Добавьте код трекера на ваш сайт для отслеживания кликов',
      content: [
        'На странице "Мои сайты" найдите ваш сайт',
        'Нажмите кнопку "Инструкция" с иконкой </>',
        'Скопируйте код трекера (кнопка "Скопировать")',
        'Откройте HTML код вашего сайта',
        'Вставьте код в раздел <head>, желательно перед </head>',
        'Сохраните изменения и опубликуйте сайт',
        'Откройте сайт в браузере - трекер начнёт работать автоматически'
      ],
      codeExample: `<!-- NoctoClick Anti-Fraud Tracker -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://noctoclick.ru/tracker.js';
    script.async = true;
    script.setAttribute('data-api-key', 'ВАШ_API_КЛЮЧ');
    document.head.appendChild(script);
  })();
</script>`
    },
    {
      id: 3,
      title: 'Настройте защиту',
      icon: Shield,
      duration: '3 минуты',
      description: 'Настройте параметры обнаружения фрода под ваши потребности',
      content: [
        'Перейдите в раздел "Настройки"',
        'Выберите ваш сайт в выпадающем списке',
        'Установите максимальное количество кликов в час (рекомендуется 3-10)',
        'Выберите порог Fraud Score (чувствительность 50-80)',
        'Включите автоматическую блокировку',
        'Выберите методы проверки (VPN, Proxy, Боты)',
        'Настройте уведомления (опционально)',
        'Нажмите "Сохранить настройки"'
      ],
      tips: [
        'Для новых сайтов рекомендуем начать с порога 70',
        'Если много ложных срабатываний - увеличьте порог',
        'Мониторьте статистику первые 2-3 дня'
      ]
    },
    {
      id: 4,
      title: 'Отслеживайте статистику',
      icon: TrendingUp,
      duration: 'Постоянно',
      description: 'Мониторьте результаты работы системы защиты',
      content: [
        'Перейдите в раздел "Дашборд"',
        'Просматривайте общую статистику: всего, легитимных, подозрительных, фрод',
        'Изучайте графики: динамику по часам, распределение по типам',
        'Используйте фильтры для поиска конкретных событий',
        'Экспортируйте данные в CSV для анализа',
        'Проверяйте заблокированные IP в разделе "Блокировки"',
        'Загружайте список IP в Яндекс.Директ для исключения'
      ],
      tips: [
        'Проверяйте статистику каждый день',
        'Обращайте внимание на резкие скачки фрода',
        'Сохраняйте отчёты для сравнения по периодам'
      ]
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Автоматическая защита',
      description: 'Система автоматически блокирует подозрительные IP адреса'
    },
    {
      icon: TrendingUp,
      title: 'Реалтайм аналитика',
      description: 'Интерактивные графики и детальная статистика'
    },
    {
      icon: Zap,
      title: 'Быстрое подключение',
      description: 'Всего 1 строка кода - и защита уже работает'
    },
    {
      icon: BookOpen,
      title: 'Простота использования',
      description: 'Интуитивный интерфейс, понятный без обучения'
    }
  ];

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Код скопирован!');
  };

  const markStepComplete = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
      toast.success(`Шаг ${stepId} завершён!`);
    }
  };

  const currentStepData = steps.find(s => s.id === currentStep);
  const Icon = currentStepData.icon;

  return (
    <div className={styles.gettingStarted}>
      <div className={styles.hero}>
        <h1>Добро пожаловать в NoctoClick! 🚀</h1>
        <p>Полное руководство по настройке и использованию системы защиты от скликивания</p>
      </div>

      {/* Прогресс */}
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          />
        </div>
        <div className={styles.progressText}>
          {completedSteps.length} из {steps.length} шагов завершено
        </div>
      </div>

      {/* Шаги */}
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`${styles.stepButton} ${
              currentStep === step.id ? styles.active : ''
            } ${
              completedSteps.includes(step.id) ? styles.completed : ''
            }`}
          >
            <div className={styles.stepNumber}>
              {completedSteps.includes(step.id) ? (
                <CheckCircle size={20} />
              ) : (
                index + 1
              )}
            </div>
            <div className={styles.stepInfo}>
              <div className={styles.stepTitle}>{step.title}</div>
              <div className={styles.stepDuration}>{step.duration}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Контент шага */}
      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <div className={styles.contentIcon}>
            <Icon size={32} />
          </div>
          <div>
            <h2>{currentStepData.title}</h2>
            <p>{currentStepData.description}</p>
          </div>
        </div>

        <div className={styles.contentBody}>
          <h3>Инструкция:</h3>
          <ol className={styles.instructions}>
            {currentStepData.content.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>

          {currentStepData.codeExample && (
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span>Код трекера:</span>
                <button 
                  onClick={() => copyCode(currentStepData.codeExample)}
                  className={styles.copyBtn}
                >
                  <Copy size={16} />
                  Скопировать
                </button>
              </div>
              <pre>{currentStepData.codeExample}</pre>
            </div>
          )}

          {currentStepData.tips && (
            <div className={styles.tips}>
              <h4>💡 Полезные советы:</h4>
              <ul>
                {currentStepData.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.contentActions}>
          {currentStep > 1 && (
            <button 
              onClick={() => setCurrentStep(currentStep - 1)}
              className={styles.btnSecondary}
            >
              Назад
            </button>
          )}
          
          {!completedSteps.includes(currentStep) && (
            <button 
              onClick={() => markStepComplete(currentStep)}
              className={styles.btnSuccess}
            >
              <CheckCircle size={18} />
              Отметить выполненным
            </button>
          )}
          
          {currentStep < steps.length && (
            <button 
              onClick={() => setCurrentStep(currentStep + 1)}
              className={styles.btnPrimary}
            >
              Следующий шаг
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Преимущества */}
      <div className={styles.features}>
        <h2>Почему NoctoClick?</h2>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <FeatureIcon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className={styles.faq}>
        <h2>Частые вопросы</h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <h4>Как быстро начнёт работать защита?</h4>
            <p>Сразу после установки трекера. Первые данные появятся через 2-3 минуты.</p>
          </div>
          <div className={styles.faqItem}>
            <h4>Можно ли подключить несколько сайтов?</h4>
            <p>Да, количество сайтов неограничено. Каждый сайт получает уникальный API ключ.</p>
          </div>
          <div className={styles.faqItem}>
            <h4>Что делать, если блокируются настоящие клиенты?</h4>
            <p>Увеличьте порог Fraud Score в настройках или вручную разблокируйте IP в разделе "Блокировки".</p>
          </div>
          <div className={styles.faqItem}>
            <h4>Как загрузить список IP в Яндекс.Директ?</h4>
            <p>В разделе "Блокировки" нажмите "Экспорт для Яндекса" и загрузите файл в настройках кампании.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GettingStarted;