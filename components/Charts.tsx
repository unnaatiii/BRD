"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import type { Feature } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" as const },
  },
};

export function FeaturesByMonthChart({ features }: { features: Feature[] }) {
  const released = features.filter(
    (f) =>
      f.status === "Released" &&
      f.release_date != null &&
      f.release_date !== ""
  );
  const byMonth: Record<string, number> = {};
  released.forEach((f) => {
    if (!f.release_date) return;
    const month = f.release_date.slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;
  });
  const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
  const data = {
    labels: sorted.map(([m]) => m),
    datasets: [
      {
        label: "Features Released",
        data: sorted.map(([, c]) => c),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };
  return (
    <div className="h-52">
      <Bar data={data} options={chartOptions} />
    </div>
  );
}

export function FeaturesByVerticalChart({ features }: { features: Feature[] }) {
  const verticals = ["Sales", "Operations", "Finance", "Marketing"];
  const counts = verticals.map((v) => features.filter((f) => f.vertical === v).length);
  const data = {
    labels: verticals,
    datasets: [
      {
        data: counts,
        backgroundColor: [
          "rgba(34, 197, 94, 0.6)",
          "rgba(59, 130, 246, 0.6)",
          "rgba(168, 85, 247, 0.6)",
          "rgba(249, 115, 22, 0.6)",
        ],
        borderColor: ["rgb(34, 197, 94)", "rgb(59, 130, 246)", "rgb(168, 85, 247)", "rgb(249, 115, 22)"],
        borderWidth: 1,
      },
    ],
  };
  return (
    <div className="h-52">
      <Doughnut data={data} options={chartOptions} />
    </div>
  );
}

export function SuccessRateChart({ features }: { features: Feature[] }) {
  const withRate = features.filter((f) => f.success_rate != null);
  const avg =
    withRate.length > 0
      ? Math.round(withRate.reduce((s, f) => s + (f.success_rate ?? 0), 0) / withRate.length)
      : 0;
  const byVertical = ["Sales", "Operations", "Finance", "Marketing"].map((v) => {
    const arr = withRate.filter((f) => f.vertical === v);
    const avgV = arr.length ? Math.round(arr.reduce((s, f) => s + (f.success_rate ?? 0), 0) / arr.length) : 0;
    return avgV;
  });
  const data = {
    labels: ["Sales", "Operations", "Finance", "Marketing"],
    datasets: [
      {
        label: "Avg Success Rate %",
        data: byVertical,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };
  return (
    <div>
      <p className="mb-2 text-sm text-slate-600">Overall average: {avg}%</p>
      <div className="h-48">
        <Line data={data} options={chartOptions} />
      </div>
    </div>
  );
}

export function UsageScoreChart({ features }: { features: Feature[] }) {
  const withScore = features.filter((f) => f.usage_score != null);
  const avg =
    withScore.length > 0
      ? Math.round(withScore.reduce((s, f) => s + (f.usage_score ?? 0), 0) / withScore.length)
      : 0;
  const byVertical = ["Sales", "Operations", "Finance", "Marketing"].map((v) => {
    const arr = withScore.filter((f) => f.vertical === v);
    const avgV = arr.length ? Math.round(arr.reduce((s, f) => s + (f.usage_score ?? 0), 0) / arr.length) : 0;
    return avgV;
  });
  const data = {
    labels: ["Sales", "Operations", "Finance", "Marketing"],
    datasets: [
      {
        label: "Avg Usage Score",
        data: byVertical,
        backgroundColor: "rgba(168, 85, 247, 0.6)",
        borderColor: "rgb(168, 85, 247)",
        borderWidth: 1,
      },
    ],
  };
  return (
    <div>
      <p className="mb-2 text-sm text-slate-600">Overall average: {avg}</p>
      <div className="h-48">
        <Bar data={data} options={chartOptions} />
      </div>
    </div>
  );
}
