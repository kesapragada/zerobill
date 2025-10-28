// FILE: frontend/src/components/Logo.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// New version of the Logo for the Auth Layout
const Logo = () => (
  <Link to="/" className="flex flex-col items-center gap-4 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-lg">
    {/* The icon container */}
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gray-800 group-hover:scale-105 transition-transform duration-300"
      >
        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 12V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    {/* The text */}
    <span className="text-4xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
      ZeroBill
    </span>
  </Link>
);

export default Logo;