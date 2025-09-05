// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="flex items-center gap-6 p-4 bg-gray-900 text-white shadow-md">
      <Link to="/" className="font-bold text-lg">AI Prep</Link>
      
      <div className="flex gap-4">
        {token && <Link to="/interview" className="hover:text-cyan-400">Interview</Link>}
        {token && <Link to="/practice" className="hover:text-cyan-400">Practice</Link>}
        {token && <Link to="/careerpath" className="hover:text-cyan-400">Career Path</Link>}
        {token && <Link to="/autoresume" className="hover:text-cyan-400">AI Resume</Link>}
        {token && <Link to="/stats" className="hover:text-cyan-400">Stats</Link>}
      </div>

      {token ? (
        <button onClick={logout} className="ml-auto underline hover:text-red-400">
          Logout
        </button>
       ) : (
        <Link to="/" className="ml-auto underline hover:text-cyan-400">Login</Link>
       )}
    </nav>
  );
}