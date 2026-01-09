import React from 'react';
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
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ResponseChart = ({ logs }) => {
  const sortedLogs = [...logs].reverse();

  const data = {
    labels: sortedLogs.map(log => {
        const date = new Date(log.checked_at);
        return `${date.getHours()}:${date.getMinutes()}`;
    }), 
    datasets: [
      {
        label: 'Response Time (ms)',
        data: sortedLogs.map(log => log.response_time),
        borderColor: '#DFE0EC',          
        backgroundColor: 'rgba(77, 39, 78, 0.5)', 
        pointBackgroundColor: '#170D21', 
        pointBorderColor: '#DFE0EC',     
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        borderWidth: 2
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { 
          labels: { color: '#757179' } 
      },
      tooltip: {
          backgroundColor: '#27284E', 
          titleColor: '#DFE0EC',
          bodyColor: '#DFE0EC',
          borderColor: 'rgba(117, 113, 121, 0.3)',
          borderWidth: 1,
          padding: 10,
          displayColors: false
      }
    },
    scales: {
        x: {
            grid: { color: 'rgba(117, 113, 121, 0.1)' }, 
            ticks: { color: '#757179' }
        },
        y: {
            beginAtZero: true,
            grid: { color: 'rgba(117, 113, 121, 0.1)' },
            ticks: { color: '#757179' }
        }
    }
  };

  return <Line options={options} data={data} />;
};

export default ResponseChart;