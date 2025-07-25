import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
    // Inicializa el estado leyendo desde localStorage
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    // Aplica la clase al elemento <html> cada vez que el estado cambie
    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        // --- CORRECCIÓN: Se eliminó el posicionamiento absoluto ---
        <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Modo Oscuro</span>
            <div 
                onClick={toggleTheme}
                className={`relative inline-block w-12 h-6 cursor-pointer rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
            >
                <span 
                    className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isDarkMode ? 'transform translate-x-6' : ''}`}
                ></span>
            </div>
        </div>
    );
};

export default ThemeToggle;
