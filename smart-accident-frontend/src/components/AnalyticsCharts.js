import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function AnalyticsCharts({ accidents }) {

  const high = accidents.filter(
    a => a.severity === "High"
  ).length;

  const medium = accidents.filter(
    a => a.severity === "Medium"
  ).length;

  const low = accidents.filter(
    a => a.severity === "Low"
  ).length;

  const active = accidents.filter(
    a => a.status === "Active"
  ).length;

  const resolved = accidents.filter(
    a => a.status === "Resolved"
  ).length;

  const severityData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        data: [high, medium, low],
        backgroundColor: [
          "#ef4444",
          "#f59e0b",
          "#22c55e",
        ],
      },
    ],
  };

  const statusData = {
    labels: ["Active", "Resolved"],
    datasets: [
      {
        label: "Accidents",
        data: [active, resolved],
        backgroundColor: [
          "#dc2626",
          "#16a34a",
        ],
      },
    ],
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        marginTop: "30px",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        <h2>Severity Analysis</h2>
        <Pie data={severityData} />
      </div>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        <h2>Status Analysis</h2>
        <Bar data={statusData} />
      </div>
    </div>
  );
}

export default AnalyticsCharts;