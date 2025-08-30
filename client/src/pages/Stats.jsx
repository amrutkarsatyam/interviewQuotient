import React, { useEffect, useState } from "react";
import { saveStats, getStats } from "../services/api";

export default function Stats() {
  const [form, setForm] = useState({
    codingScore: "",
    communicationScore: "",
    focusScore: "",
    notes: "",
  });
  const [data, setData] = useState([]);

  const fetchStats = async () => {
    const res = await getStats();
    setData(res.data);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stats = {
      codingScore: Number(form.codingScore),
      communicationScore: Number(form.communicationScore),
      focusScore: Number(form.focusScore),
      notes: form.notes,
    };

    await saveStats(stats);
    fetchStats();
  };

  return (
    <div className="p-4">
      <h2>Save Interview Stats</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-64">
        <input
          type="number"
          name="codingScore"
          placeholder="Coding Score"
          onChange={handleChange}
          className="border p-2"
        />
        <input
          type="number"
          name="communicationScore"
          placeholder="Communication Score"
          onChange={handleChange}
          className="border p-2"
        />
        <input
          type="number"
          name="focusScore"
          placeholder="Focus Score"
          onChange={handleChange}
          className="border p-2"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          onChange={handleChange}
          className="border p-2"
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          Save
        </button>
      </form>

      <h2 className="mt-6">Previous Stats</h2>
      <ul>
        {data.map((s) => (
          <li key={s._id}>
            {s.overallScore} - {new Date(s.createdAt).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
