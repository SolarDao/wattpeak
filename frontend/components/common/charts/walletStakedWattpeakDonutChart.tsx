import React, { use } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Box, useColorModeValue } from '@chakra-ui/react';

// Register required components
ChartJS.register(ArcElement, Tooltip, Legend, Title);


type DonutChartProps = {
  totalMinted: number;
  totalStaked: number;
  inputColor: string;
};

const DonutChart: React.FC<DonutChartProps> = ({ totalMinted, totalStaked, inputColor }) => {
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
    <Box style={{ height: '200px', width: '200px' }}>
      <Doughnut data={data} options={options} />
    </Box>
  );
};

export default DonutChart;
