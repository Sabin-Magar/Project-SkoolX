"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PredictionChart = ({
  pastScores,
  predictedScore,
}: {
  pastScores: number[];
  predictedScore: number;
}) => {
  const data = pastScores.map((score, i) => ({
    name: `Exam ${i + 1}`,
    score,
    predicted: null as number | null,
  }));

  // add bridge point
  data.push({
    name: `Exam ${pastScores.length + 1}`,
    score: null as any,
    predicted: predictedScore,
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[40, 100]}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "0.5px solid #e5e7eb",
            fontSize: "12px",
          }}
        />
        <ReferenceLine
          x={`Exam ${pastScores.length + 1}`}
          stroke="#a78bfa"
          strokeDasharray="4 3"
          label={{ value: "Predicted", position: "top", fontSize: 11, fill: "#7c3aed" }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={{ r: 4, fill: "#60a5fa" }}
          activeDot={{ r: 6 }}
          name="Past scores"
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#34d399"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 6, fill: "#34d399" }}
          name="Predicted"
          connectNulls={false}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PredictionChart;