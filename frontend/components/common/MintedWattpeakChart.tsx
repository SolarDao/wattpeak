import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register necessary chart components
ChartJS.register(ArcElement, Tooltip, Legend);

type WattpeakPieChartProps = {
  totalMinted: number;
  totalWattpeak: number;
};

const WattpeakPieChart: React.FC<WattpeakPieChartProps> = ({ totalMinted, totalWattpeak }) => {
  const data = {
    labels: ['Minted', 'Available'],
    datasets: [
      {
        data: [totalMinted, totalWattpeak],
        backgroundColor: ['#ff5b1a', '#009886'],
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div style={{ height: '200px', width: '200px' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default WattpeakPieChart;
