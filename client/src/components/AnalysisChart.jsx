import React, { useEffect, useState } from "react";
import { getStats } from "../services/api";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalysisChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getStats();
        // Map DB response into chart-friendly format
        const mapped = res.data.map((s) => ({
          date: new Date(s.createdAt).toLocaleDateString(),
          coding: s.codingScore,
          communication: s.communicationScore,
          focus: s.focusScore,
          overall: s.overallScore,
        }));
        setData(mapped.reverse()); // reverse so oldest first
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Performance Over Time</h2>
      {data.length === 0 ? (
        <p>No data yet. Complete an interview to see stats.</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="coding" stroke="#8884d8" />
            <Line type="monotone" dataKey="communication" stroke="#82ca9d" />
            <Line type="monotone" dataKey="focus" stroke="#ffc658" />
            <Line type="monotone" dataKey="overall" stroke="#ff0000" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
