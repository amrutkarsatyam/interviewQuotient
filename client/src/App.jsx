// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Interview from './pages/Interview';
import Profile from './pages/Profile'; // Import the new Profile page

// A simple protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <>
      <h1 className="text-5xl font-extrabold text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-600 to-cyan-500">
        Interview Quotient
      </h1>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            }
          />
          {/* Add the new Profile route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* Redirect any other path to the login page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;