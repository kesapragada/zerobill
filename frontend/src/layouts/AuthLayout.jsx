// FILE: frontend/src/layouts/AuthLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo'; 

const AuthLayout = () => {
  return (
    // Main container now uses a grid for the two columns
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-white text-gray-800">
      
      {/* Left Column: Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gray-50 border-r border-gray-200">
        <div className="text-center max-w-sm">
          <Logo />
          <p className="mt-4 text-lg text-gray-600">
            Intelligent cloud cost monitoring, simplified.
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* We no longer need a <Card> wrapper here as the layout provides the structure */}
          {/* The <Outlet> will render the Login, Register, etc., pages */}
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;