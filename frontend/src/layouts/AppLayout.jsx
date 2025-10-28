// frontend/src/layouts/AppLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { HomeIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const AppLayout = () => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'AWS Settings', href: '/configure-aws', icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex h-screen bg-navy-darkest text-navy-light">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-navy-dark border-r border-navy-medium">
        <div className="flex items-center justify-center h-20 border-b border-navy-medium">
          <Logo />
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 mt-2 text-sm rounded-lg transition-colors duration-200 ${
                    isActive ? 'bg-brand-primary text-white' : 'text-navy-light hover:bg-navy-medium hover:text-white'
                  }`
                }
              >
                <item.icon className="w-6 h-6 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-navy-medium">
           <p className="text-sm text-navy-light truncate" title={user?.email}>{user?.email}</p>
           <button onClick={logout} className="w-full flex items-center justify-center mt-2 px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
              Logout
           </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;