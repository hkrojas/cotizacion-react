import React, { useState } from 'react';

const DeactivationModal = ({ isOpen, onClose, onConfirm, userEmail }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        // Pasa el motivo al confirmar
        onConfirm(reason);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md transform transition-all animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start space-x-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100">
                            Desactivar Usuario
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Vas a desactivar a <strong>{userEmail}</strong>. Por favor, ingresa el motivo.
                            </p>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ej: Inactividad, violación de términos..."
                                className="mt-3 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                rows="3"
                            ></textarea>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:bg-red-400"
                        onClick={handleConfirm}
                        disabled={!reason.trim()} // El botón se activa solo si hay un motivo
                    >
                        Confirmar Desactivación
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeactivationModal;
