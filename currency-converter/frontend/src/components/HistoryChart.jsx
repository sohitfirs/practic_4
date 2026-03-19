import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { getHistory } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function HistoryChart({ from, to }) {
  const [chartData, setChartData] = useState(null);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!from || !to) {
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getHistory(from, to, period);
        
        if (data && data.length > 0) {
          const formattedData = data.map(item => ({
            ...item,
            displayDate: formatDate(item.date),
            rate: parseFloat(item.rate)
          }));
          
          const lineColor = 'rgb(13, 79, 139)';
          
          setChartData({
            labels: formattedData.map(d => d.displayDate),
            datasets: [{
              label: `1 ${from} = ${to}`,
              data: formattedData.map(d => d.rate),
              borderColor: lineColor,
              backgroundColor: lineColor.replace('rgb', 'rgba').replace(')', ', 0.1)'),
              borderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: lineColor,
              pointBorderColor: 'white',
              pointBorderWidth: 2,
              tension: 0.1,
              fill: true
            }]
          });
        } else {
          setChartData(null);
        }
      } catch (err) {
        setError('Не удалось загрузить данные графика');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [from, to, period]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('.')) {
      const [day, month, year] = dateStr.split('.');
      return `${day}.${month}.${year}`;
    }
    const [day, month, year] = dateStr.split('/');
    return `${day}.${month}.${year}`;
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: { size: 12 }
        }
      },
      title: {
        display: true,
        text: `Курс ${from} к ${to}`,
        font: { size: 16, weight: 'bold' },
        color: '#1f2937'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += context.parsed.y.toFixed(4);
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { callback: value => value.toFixed(4) },
        title: { display: true, text: 'Курс обмена' }
      },
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 45, maxTicksLimit: 8, font: { size: 11 } },
        title: { display: true, text: 'Дата' }
      }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  if (!from || !to) {
    return (
      <div className="chart-container">
        <p>Выберите валюты для просмотра истории</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <label>Период: </label>
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="week">Последние 7 дней</option>
          <option value="month">Последние 30 дней</option>
          <option value="year">Последние 365 дней</option>
        </select>
      </div>
      
      <div style={{ height: '400px', position: 'relative' }}>
        {loading && (
          <div className="chart-loading"><p>Загрузка данных графика...</p></div>
        )}
        
        {error && (
          <div className="chart-error"><p>{error}</p></div>
        )}
        
        {!loading && !error && !chartData && (
          <div className="chart-empty">
            <p>Нет данных за выбранный период</p>
            <p className="chart-empty-hint">
              Попробуйте выбрать другой период или другую пару валют
            </p>
          </div>
        )}
        
        {!loading && !error && chartData && chartData.labels.length > 0 && (
          <Line options={options} data={chartData} />
        )}
      </div>
    </div>
  );
}