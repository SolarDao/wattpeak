import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StackedBarChart = ({ balances }) => {
  // Extract and map balances to chart data
  const labels = balances.map((balance) =>
    balance.denom === "ujunox" ? "JUNO" : "WattPeak"
  );
  const dataValues = balances.map((balance) => balance.amount / 1000000);
  const colors = ["rgba(54, 162, 235, 0.6)", "rgba(255, 206, 86, 0.6)"];

  const data = {
    labels: ["My wallet"],
    datasets: labels.map((label, index) => ({
      label: `${label} (${dataValues[index].toFixed(2)})`,
      data: [dataValues[index]],
      backgroundColor: colors[index],
      barThickness: 20, // Set bar thickness here
    })),
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false, // Allow customization of height
    aspectRatio: 2, // Adjust this value to make the graph less high
    plugins: {
      legend: {
        position: "bottom", // Move the legend to the bottom
        labels: {
          boxWidth: 20,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false, // Hide grid lines on x-axis
          drawBorder: false, // Remove outer border lines
        },
        ticks: {
          display: false, // Hide ticks on x-axis
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false, // Hide grid lines on y-axis
          drawBorder: false, // Remove outer border lines
        },
        ticks: {
          display: false, // Hide ticks on y-axis
        },
        border: {
          display: false, // Hide the outer borders
        },
      },
    },
  };

  return (
    <div
      style={{
        height: "100px",
        background: "rgba(245, 245, 245, 1)",
        borderRadius: "23px",
        padding: "20px",
      }}
    >
      {" "}
      {/* Adjust the height value here */}
      <Bar data={data} options={options} />
    </div>
  );
};

export default StackedBarChart;
