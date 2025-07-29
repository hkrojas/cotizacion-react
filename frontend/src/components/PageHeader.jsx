// src/components/PageHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const PageHeader = ({ title, icon, children }) => {
  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Título e Ícono */}
          <div className="flex items-center space-x-3">
            {icon}
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {title}
            </h1>
          </div>
          
          {/* Acciones del Header (hijos del componente) */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {children}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
