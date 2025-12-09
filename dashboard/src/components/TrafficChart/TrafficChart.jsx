import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './TrafficChart.module.css';

function TrafficChart({ data }) {
  if (!data || data.length === 0) {
    return <div className={styles.empty}>Нет данных для отображения</div>;
  }

  const chartData = data.map(item => ({
    time: format(new Date(item.hour), 'HH:mm', { locale: ru }),
    fullDate: format(new Date(item.hour), 'dd MMM HH:mm', { locale: ru }),
    total: parseInt(item.total),
    fraud: parseInt(item.fraud_count),
    suspicious: parseInt(item.suspicious_count),
    legitimate: parseInt(item.total) - parseInt(item.fraud_count) - parseInt(item.suspicious_count)
  }));

  return (
    <div className={styles.container}>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis 
            dataKey="time" 
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)'
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullDate;
              }
              return label;
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="var(--color-primary)" 
            strokeWidth={2}
            name="Всего"
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="legitimate" 
            stroke="var(--color-success)" 
            strokeWidth={2}
            name="Легитимные"
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="suspicious" 
            stroke="var(--color-warning)" 
            strokeWidth={2}
            name="Подозрительные"
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="fraud" 
            stroke="var(--color-danger)" 
            strokeWidth={2}
            name="Фродовые"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrafficChart;