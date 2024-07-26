import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

// Register required components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

type DonutChartProps = {
  totalMinted: number;
  totalStaked: number;
};

const DonutChart: React.FC<DonutChartProps> = ({ totalMinted, totalStaked }) => {
  const data = {
    labels: ['Staked', 'Unstaked'],
    datasets: [
      {
        data: [totalStaked, totalMinted],
        backgroundColor: ['#FF6384', '#36A2EB'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB'],
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    cutoutPercentage: 70,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div style={{ height: '300px', width: '300px' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default DonutChart;
