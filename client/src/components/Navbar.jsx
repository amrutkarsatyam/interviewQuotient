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
    <nav className="flex gap-4 p-4 bg-gray-800 text-white">
      <Link to="/">Auth</Link>
      {token && <Link to="/stats">Stats</Link>}
      {token && <Link to="/interview">Interview</Link>}
      {token ? (
        <button onClick={logout} className="ml-auto underline">
          Logout
        </button>
      ) : null}
    </nav>
  );
}
