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

type StakedWattpeakPieChartProps = {
  totalStaked: number;
  totalMinted: number;
  inputColor: string;
};

const StakedWattpeakPieChart: React.FC<StakedWattpeakPieChartProps> = ({ totalStaked, totalMinted, inputColor }) => {
  const data = {
    labels: ['Staked', 'Unstaked'],
    datasets: [
      {
        data: [totalStaked, totalMinted - totalStaked],
        backgroundColor: ['#FAD987', '#FFBC1A'],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10, // Width of the legend box (smaller square)
          boxHeight: 10, // Optional: Set to make it a square
          padding: 10, // Optional: Spacing between legend items
          color: inputColor,
        },
      },
    },
  };

  return (
    <div style={{ height: '200px', width: '200px' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default StakedWattpeakPieChart;
