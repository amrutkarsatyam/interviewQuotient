// client/src/components/interview/Header.jsx
import React from 'react';

const Header = ({ title, subtitle }) => (
  <div className="p-6 bg-white border border-slate-200 rounded-xl">
    <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
    {subtitle && <p className="text-md text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

export default Header;