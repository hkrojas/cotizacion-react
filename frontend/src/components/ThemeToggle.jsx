import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
    // La lógica para manejar el estado del tema permanece igual.
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

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

    // --- NUEVO DISEÑO CON ÍCONOS ---
    // Se reemplaza el interruptor por un botón que muestra un ícono de Sol o Luna.

    // Ícono de Sol (para mostrar en modo oscuro, para cambiar a modo claro)
    const SunIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );

    // Ícono de Luna (para mostrar en modo claro, para cambiar a modo oscuro)
    const MoonIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    );

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-blue-500 transition-all duration-300 transform hover:scale-110"
            aria-label="Toggle theme"
        >
            {/* Muestra el ícono correspondiente con una transición de rotación */}
            <div className={`transition-transform duration-500 ${isDarkMode ? 'rotate-90' : 'rotate-0'}`}>
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </div>
        </button>
    );
};

export default ThemeToggle;
