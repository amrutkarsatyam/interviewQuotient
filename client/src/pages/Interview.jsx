import React, { useState } from "react";
import { saveStats } from "../services/api";

export default function Interview() {
  const [codingScore, setCodingScore] = useState("");
  const [communicationScore, setCommunicationScore] = useState("");
  const [focusScore, setFocusScore] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const stats = {
        codingScore: Number(codingScore),
        communicationScore: Number(communicationScore),
        focusScore: Number(focusScore),
        notes,
      };

      await saveStats(stats);

      setStatus("Saved to DB");
      setCodingScore("");
      setCommunicationScore("");
      setFocusScore("");
      setNotes("");
    } catch (err) {
      setStatus("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Mock Interview</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-64">
        <input
          type="number"
          placeholder="Coding Score"
          value={codingScore}
          onChange={(e) => setCodingScore(e.target.value)}
          className="border p-2"
        />
        <input
          type="number"
          placeholder="Communication Score"
          value={communicationScore}
          onChange={(e) => setCommunicationScore(e.target.value)}
          className="border p-2"
        />
        <input
          type="number"
          placeholder="Focus Score"
          value={focusScore}
          onChange={(e) => setFocusScore(e.target.value)}
          className="border p-2"
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Save Results
        </button>
      </form>

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
