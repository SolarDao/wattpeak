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
};

const StakedWattpeakPieChart: React.FC<StakedWattpeakPieChartProps> = ({ totalStaked, totalMinted }) => {
  const data = {
    labels: ['Staked Wattpeak', 'Unstaked Wattpeak'],
    datasets: [
      {
        data: [totalStaked, totalMinted - totalStaked],
        backgroundColor: ['#FAD987', '#FFBC1A'],
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div style={{ height: '300px', width: '300px' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default StakedWattpeakPieChart;
