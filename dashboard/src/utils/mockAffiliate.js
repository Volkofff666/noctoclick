// Mock данные для партнёрской программы

export const mockAffiliateStats = {
  stats: {
    totalReferrals: 24,
    activeReferrals: 18,
    availableBalance: 45600,
    onHold: 12300,
    holdDays: 7,
    monthlyEarnings: 28900,
    monthlyGoal: 50000,
    totalEarned: 156780,
    partnerLevel: 'Серебро',
    conversionRate: 75
  },
  referralCode: 'NOCTO2025'
};

export const mockReferrals = {
  referrals: [
    {
      email: 'alex.ivanov@example.com',
      registeredAt: '2024-11-15T10:30:00Z',
      isActive: true,
      totalPayments: 4,
      yourEarnings: 12000
    },
    {
      email: 'maria.petrova@company.ru',
      registeredAt: '2024-11-20T14:22:00Z',
      isActive: true,
      totalPayments: 3,
      yourEarnings: 9000
    },
    {
      email: 'dmitry.web@agency.com',
      registeredAt: '2024-11-25T09:15:00Z',
      isActive: true,
      totalPayments: 5,
      yourEarnings: 15000
    },
    {
      email: 'elena.design@studio.ru',
      registeredAt: '2024-12-01T11:45:00Z',
      isActive: true,
      totalPayments: 2,
      yourEarnings: 6000
    },
    {
      email: 'igor.marketing@ads.com',
      registeredAt: '2024-12-03T16:30:00Z',
      isActive: true,
      totalPayments: 3,
      yourEarnings: 9000
    },
    {
      email: 'anna.seo@digital.ru',
      registeredAt: '2024-12-05T13:20:00Z',
      isActive: true,
      totalPayments: 2,
      yourEarnings: 6000
    },
    {
      email: 'sergey.dev@tech.com',
      registeredAt: '2024-11-18T08:45:00Z',
      isActive: false,
      totalPayments: 1,
      yourEarnings: 3000
    },
    {
      email: 'olga.content@media.ru',
      registeredAt: '2024-11-22T15:10:00Z',
      isActive: true,
      totalPayments: 4,
      yourEarnings: 12000
    },
    {
      email: 'pavel.analytics@data.com',
      registeredAt: '2024-11-28T10:00:00Z',
      isActive: true,
      totalPayments: 3,
      yourEarnings: 9000
    },
    {
      email: 'natalia.pm@project.ru',
      registeredAt: '2024-12-02T12:30:00Z',
      isActive: true,
      totalPayments: 2,
      yourEarnings: 6000
    },
    {
      email: 'viktor.smm@social.com',
      registeredAt: '2024-11-12T09:20:00Z',
      isActive: false,
      totalPayments: 1,
      yourEarnings: 3000
    },
    {
      email: 'irina.pr@comm.ru',
      registeredAt: '2024-11-30T14:50:00Z',
      isActive: true,
      totalPayments: 2,
      yourEarnings: 6000
    },
    {
      email: 'andrey.ceo@startup.com',
      registeredAt: '2024-11-10T11:00:00Z',
      isActive: true,
      totalPayments: 6,
      yourEarnings: 18000
    },
    {
      email: 'svetlana.hr@company.ru',
      registeredAt: '2024-12-04T15:40:00Z',
      isActive: true,
      totalPayments: 1,
      yourEarnings: 3000
    },
    {
      email: 'roman.sales@b2b.com',
      registeredAt: '2024-11-16T10:15:00Z',
      isActive: true,
      totalPayments: 4,
      yourEarnings: 12000
    },
    {
      email: 'julia.design@creative.ru',
      registeredAt: '2024-11-24T13:00:00Z',
      isActive: false,
      totalPayments: 1,
      yourEarnings: 3000
    },
    {
      email: 'maxim.tech@innovation.com',
      registeredAt: '2024-12-06T09:30:00Z',
      isActive: true,
      totalPayments: 1,
      yourEarnings: 3000
    },
    {
      email: 'ekaterina.bizdev@growth.ru',
      registeredAt: '2024-11-14T16:20:00Z',
      isActive: true,
      totalPayments: 5,
      yourEarnings: 15000
    },
    {
      email: 'denis.product@saas.com',
      registeredAt: '2024-11-26T12:10:00Z',
      isActive: true,
      totalPayments: 3,
      yourEarnings: 9000
    },
    {
      email: 'tatiana.finance@invest.ru',
      registeredAt: '2024-12-01T10:45:00Z',
      isActive: false,
      totalPayments: 1,
      yourEarnings: 3000
    },
    {
      email: 'konstantin.strategy@consulting.com',
      registeredAt: '2024-11-19T14:30:00Z',
      isActive: true,
      totalPayments: 4,
      yourEarnings: 12000
    },
    {
      email: 'victoria.ops@automation.ru',
      registeredAt: '2024-11-29T11:20:00Z',
      isActive: true,
      totalPayments: 2,
      yourEarnings: 6000
    },
    {
      email: 'nikolay.support@service.com',
      registeredAt: '2024-12-07T15:00:00Z',
      isActive: true,
      totalPayments: 1,
      yourEarnings: 3000
    },
    {
      email: 'alina.community@network.ru',
      registeredAt: '2024-11-21T09:50:00Z',
      isActive: false,
      totalPayments: 2,
      yourEarnings: 6000
    }
  ]
};

export const mockEarnings = {
  earnings: [
    {
      date: '2024-12-08T10:30:00Z',
      referralEmail: 'alex.ivanov@example.com',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-12-07T14:20:00Z',
      referralEmail: 'maria.petrova@company.ru',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-12-06T09:15:00Z',
      referralEmail: 'dmitry.web@agency.com',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-12-05T11:45:00Z',
      referralEmail: 'Вывод средств',
      type: 'payout',
      amount: 25000,
      status: 'completed'
    },
    {
      date: '2024-12-04T16:30:00Z',
      referralEmail: 'elena.design@studio.ru',
      type: 'commission',
      amount: 3000,
      status: 'pending'
    },
    {
      date: '2024-12-03T13:20:00Z',
      referralEmail: 'igor.marketing@ads.com',
      type: 'commission',
      amount: 3000,
      status: 'pending'
    },
    {
      date: '2024-12-02T08:45:00Z',
      referralEmail: 'anna.seo@digital.ru',
      type: 'commission',
      amount: 3000,
      status: 'pending'
    },
    {
      date: '2024-12-01T15:10:00Z',
      referralEmail: 'olga.content@media.ru',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-30T10:00:00Z',
      referralEmail: 'pavel.analytics@data.com',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-29T12:30:00Z',
      referralEmail: 'natalia.pm@project.ru',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-28T14:50:00Z',
      referralEmail: 'andrey.ceo@startup.com',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-27T11:00:00Z',
      referralEmail: 'roman.sales@b2b.com',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-26T15:40:00Z',
      referralEmail: 'ekaterina.bizdev@growth.ru',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-25T10:15:00Z',
      referralEmail: 'denis.product@saas.com',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-24T13:00:00Z',
      referralEmail: 'konstantin.strategy@consulting.com',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-23T09:30:00Z',
      referralEmail: 'victoria.ops@automation.ru',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-22T16:20:00Z',
      referralEmail: 'alex.ivanov@example.com',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-21T12:10:00Z',
      referralEmail: 'maria.petrova@company.ru',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    },
    {
      date: '2024-11-20T10:45:00Z',
      referralEmail: 'Вывод средств',
      type: 'payout',
      amount: 30000,
      status: 'completed'
    },
    {
      date: '2024-11-19T14:30:00Z',
      referralEmail: 'dmitry.web@agency.com',
      type: 'commission',
      amount: 3000,
      status: 'completed'
    }
  ]
};

export const mockEarningsChart = {
  data: [
    { date: '2024-11-09', value: 6000 },
    { date: '2024-11-10', value: 9000 },
    { date: '2024-11-11', value: 12000 },
    { date: '2024-11-12', value: 15000 },
    { date: '2024-11-13', value: 18000 },
    { date: '2024-11-14', value: 21000 },
    { date: '2024-11-15', value: 27000 },
    { date: '2024-11-16', value: 30000 },
    { date: '2024-11-17', value: 33000 },
    { date: '2024-11-18', value: 36000 },
    { date: '2024-11-19', value: 42000 },
    { date: '2024-11-20', value: 45000 },
    { date: '2024-11-21', value: 51000 },
    { date: '2024-11-22', value: 54000 },
    { date: '2024-11-23', value: 57000 },
    { date: '2024-11-24', value: 63000 },
    { date: '2024-11-25', value: 66000 },
    { date: '2024-11-26', value: 72000 },
    { date: '2024-11-27', value: 75000 },
    { date: '2024-11-28', value: 81000 },
    { date: '2024-11-29', value: 84000 },
    { date: '2024-11-30', value: 90000 },
    { date: '2024-12-01', value: 93000 },
    { date: '2024-12-02', value: 99000 },
    { date: '2024-12-03', value: 105000 },
    { date: '2024-12-04', value: 111000 },
    { date: '2024-12-05', value: 117000 },
    { date: '2024-12-06', value: 126000 },
    { date: '2024-12-07', value: 132000 },
    { date: '2024-12-08', value: 138000 }
  ]
};
