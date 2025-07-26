import React, { createContext, useState, useCallback } from 'react';

// Creamos el contexto para las notificaciones
export const ToastContext = createContext();

// Proveedor del contexto que manejará la lógica de las notificaciones
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    // Función para añadir una nueva notificación. Usamos useCallback para optimización.
    const addToast = useCallback((message, type = 'info') => {
        // Creamos un ID único para cada toast para poder eliminarlo después
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);

        // Hacemos que la notificación desaparezca después de 5 segundos
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    // Función para eliminar una notificación por su ID
    const removeToast = (id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* El contenedor donde se renderizarán las notificaciones */}
            <div className="fixed top-5 right-5 z-[100] space-y-3">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// Componente individual para cada notificación (Toast)
const Toast = ({ message, type, onClose }) => {
    // Definimos los estilos y el ícono según el tipo de notificación (info, success, error)
    const baseStyle = "flex items-center w-full max-w-xs p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow-lg dark:text-gray-400 dark:divide-gray-700 dark:bg-gray-800 transition-all duration-300 transform animate-fade-in-right";
    
    let icon;
    let typeClasses;

    switch (type) {
        case 'success':
            icon = <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>;
            typeClasses = "text-green-500 dark:text-green-400";
            break;
        case 'error':
            icon = <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>;
            typeClasses = "text-red-500 dark:text-red-400";
            break;
        default:
            icon = <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>;
            typeClasses = "text-blue-500 dark:text-blue-400";
            break;
    }

    return (
        <div className={baseStyle} role="alert">
            <div className={`flex-shrink-0 ${typeClasses}`}>
                {icon}
            </div>
            <div className="pl-4 text-sm font-normal">{message}</div>
            <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
        </div>
    );
};
