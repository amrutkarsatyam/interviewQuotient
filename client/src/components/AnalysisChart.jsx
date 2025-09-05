// src/components/AnalysisChart.jsx
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
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getStats();
        if (res.data && res.data.length > 0) {
            const mapped = res.data.map((s) => ({
              date: new Date(s.createdAt).toLocaleDateString(),
              'Technical': s.scores.technicalAccuracy || 0,
              'Communication': s.scores.communicationClarity || 0,
              'Confidence': s.scores.confidenceLevel || 0,
              'Time Mgmt': s.scores.timeManagement || 0,
              'Focus': s.focusPercent || 0,
              'Overall': s.overallScore,
            }));
            setData(mapped.reverse());
        }
      } catch (err) {
        console.error("Failed to load stats", err);
        setError("Could not load your performance data.");
      }
    };
    fetchStats();
  }, []);

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl mb-4 text-white">Performance Over Time</h2>
      {data.length === 0 ? (
        <p className="text-gray-400">No data yet. Complete an interview to see your stats.</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="date" stroke="#a0aec0" />
            <YAxis stroke="#a0aec0" />
            <Tooltip
              contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#e2e8f0' }} />
            <Line type="monotone" dataKey="Technical" stroke="#8884d8" />
            <Line type="monotone" dataKey="Communication" stroke="#82ca9d" />
            <Line type="monotone" dataKey="Confidence" stroke="#ffc658" />
            <Line type="monotone" dataKey="Focus" stroke="#ff7300" />
            <Line type="monotone" dataKey="Overall" stroke="#e53e3e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}