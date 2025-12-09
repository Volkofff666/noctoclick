// Утилиты для экспорта данных в CSV

/**
 * Конвертирует массив объектов в CSV строку
 */
export function convertToCSV(data, headers) {
  if (!data || data.length === 0) return '';

  // Заголовки
  const headerRow = headers.map(h => h.label).join(',');
  
  // Данные
  const dataRows = data.map(item => {
    return headers.map(h => {
      let value = item[h.key];
      
      // Обработка дат
      if (value instanceof Date) {
        value = value.toLocaleString('ru');
      } else if (h.key.includes('_at') && value) {
        value = new Date(value).toLocaleString('ru');
      }
      
      // Обработка boolean
      if (typeof value === 'boolean') {
        value = value ? 'Да' : 'Нет';
      }
      
      // Экранирование запятых и кавычек
      if (value && typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      }
      
      return value !== null && value !== undefined ? value : '';
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Скачивает CSV файл
 */
export function downloadCSV(csvContent, filename) {
  // Добавляем BOM для корректного отображения кириллицы в Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Экспорт событий в CSV
 */
export function exportEventsToCSV(events, siteName) {
  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'ip', label: 'IP адрес' },
    { key: 'user_agent', label: 'User Agent' },
    { key: 'fraud_score', label: 'Fraud Score' },
    { key: 'is_fraud', label: 'Фрод' },
    { key: 'is_suspicious', label: 'Подозрительный' },
    { key: 'created_at', label: 'Дата и время' }
  ];
  
  const csv = convertToCSV(events, headers);
  const filename = `события_${siteName}_${Date.now()}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Экспорт заблокированных IP в CSV
 */
export function exportBlockedToCSV(blocked, siteName) {
  const headers = [
    { key: 'ip', label: 'IP адрес' },
    { key: 'reason', label: 'Причина' },
    { key: 'fraud_score', label: 'Fraud Score' },
    { key: 'blocked_at', label: 'Дата блокировки' },
    { key: 'auto_unblock_at', label: 'Авторазблокировка' },
    { key: 'is_permanent', label: 'Постоянная' }
  ];
  
  const csv = convertToCSV(blocked, headers);
  const filename = `заблокированные_ip_${siteName}_${Date.now()}.csv`;
  downloadCSV(csv, filename);
}

/**
 * Экспорт статистики в CSV
 */
export function exportStatsToCSV(stats, siteName, period) {
  const data = [
    { metric: 'Всего событий', value: stats.total },
    { metric: 'Легитимные', value: stats.legitimate },
    { metric: 'Подозрительные', value: stats.suspicious },
    { metric: 'Фрод', value: stats.fraud },
    { metric: '% легитимных', value: ((stats.legitimate / stats.total) * 100).toFixed(2) + '%' },
    { metric: '% подозрительных', value: ((stats.suspicious / stats.total) * 100).toFixed(2) + '%' },
    { metric: '% фрода', value: ((stats.fraud / stats.total) * 100).toFixed(2) + '%' }
  ];
  
  const headers = [
    { key: 'metric', label: 'Метрика' },
    { key: 'value', label: 'Значение' }
  ];
  
  const csv = convertToCSV(data, headers);
  const filename = `статистика_${siteName}_${period}_${Date.now()}.csv`;
  downloadCSV(csv, filename);
}