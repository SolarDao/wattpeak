import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Box } from "@chakra-ui/react";

ChartJS.register(ArcElement, Tooltip, Legend);

type WattpeakPieChartProps = {
  totalMinted: number;
  totalWattpeak: number;
  inputColor: string;
};

const WattpeakPieChart: React.FC<WattpeakPieChartProps> = ({
  totalMinted,
  totalWattpeak,
  inputColor,
}) => {
  const data = {
    labels: ["Minted", "Available"],
    datasets: [
      {
        data: [totalMinted, totalWattpeak-totalMinted],
        backgroundColor: ["#ff5b1a", "#49a83b"],
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
    <Box
      style={{
        height: "200px",
        width: "200px",
      }}
    >
      <Pie data={data} options={options} />
    </Box>
  );
};

export default WattpeakPieChart;
