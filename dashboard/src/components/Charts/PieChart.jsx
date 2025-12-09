import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './Charts.module.css';

const COLORS = {
  legitimate: '#10b981',
  suspicious: '#f59e0b',
  fraud: '#ef4444'
};

function CustomPieChart({ data, title }) {
  const chartData = [
    { name: 'Легитимные', value: data.legitimate, color: COLORS.legitimate },
    { name: 'Подозрительные', value: data.suspicious, color: COLORS.suspicious },
    { name: 'Фрод', value: data.fraud, color: COLORS.fraud }
  ];

  const renderLabel = (entry) => {
    const percent = ((entry.value / data.total) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <div className={styles.chartContainer}>
      {title && <h3 className={styles.chartTitle}>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CustomPieChart;