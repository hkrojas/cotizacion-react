import React from 'react';

const LoadingSpinner = ({ message = "Cargando...", fullScreen = false }) => {
    const containerClasses = fullScreen 
        ? "fixed inset-0 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center z-50 transition-colors duration-300"
        : "flex flex-col items-center justify-center p-8";

    return (
        <div className={containerClasses}>
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">{message}</p>
        </div>
    );
};

export default LoadingSpinner;