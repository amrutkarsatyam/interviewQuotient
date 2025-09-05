// src/Routings.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Stats from "./pages/Stats";
import Interview from "./pages/Interview.jsx";
import Navbar from "./components/Navbar";
import { getProfile } from "./services/api";

// --- IMPORT NEW PAGES ---
import AutoResume from "./pages/AutoResume.jsx";
import CareerPathfinder from "./pages/CareerPathfinder.jsx";
import PracticeCoding from "./pages/PracticeCoding.jsx";


const PrivateRoute = ({ children }) => {
  const [verified, setVerified] = useState(null);

  useEffect(() => {
    async function check() {
      const token = localStorage.getItem("token");
      if (!token) {
        setVerified(false);
        return;
      }
      try {
        await getProfile();
        setVerified(true);
      } catch {
        localStorage.removeItem("token");
        setVerified(false);
      }
    }
    check();
  }, []);

  if (verified === null) return <div className="p-8 text-center">Loading...</div>;
  return verified ? children : <Navigate to="/" />;
};


export default function Routings() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Auth />} />
          
          {/* --- PROTECTED ROUTES --- */}
          <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
          <Route path="/interview" element={<PrivateRoute><Interview /></PrivateRoute>} />
          <Route path="/autoresume" element={<PrivateRoute><AutoResume /></PrivateRoute>} />
          <Route path="/careerpath" element={<PrivateRoute><CareerPathfinder /></PrivateRoute>} />
          <Route path="/practice" element={<PrivateRoute><PracticeCoding /></PrivateRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}