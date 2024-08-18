import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Box } from '@chakra-ui/react';

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
        backgroundColor: ['#FAD987', '#FFBC1A'],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <Box style={{ height: '200px', width: '200px' }}>
      <Doughnut data={data} options={options} />
    </Box>
  );
};

export default DonutChart;
