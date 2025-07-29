// src/components/AdminLayout.jsx
// NUEVO COMPONENTE: Layout principal para el panel de admin con sidebar.

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

// Íconos para el sidebar
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197M12 12.146V12" /></svg>;

const AdminLayout = ({ children }) => {
  const linkStyle = "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200";
  const activeLinkStyle = "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-semibold";
  const inactiveLinkStyle = "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700";

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
          <h1 className="text-xl font-bold text-purple-700 dark:text-purple-300">Admin Panel</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLink to="/admin/dashboard" className={({ isActive }) => `${linkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}>
            <DashboardIcon />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `${linkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}>
            <UsersIcon />
            <span>Usuarios</span>
          </NavLink>
        </nav>
        <div className="p-4 border-t dark:border-gray-700">
          <Link to="/dashboard" className="w-full text-center block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Volver al Dashboard Principal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-end px-6">
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
