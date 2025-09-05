// src/pages/Stats.jsx
import React from "react";
import AnalysisChart from "../components/AnalysisChart";

export default function Stats() {
  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Progress</h1>
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
         <AnalysisChart />
      </div>
    </div>
  );
}