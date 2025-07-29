// src/pages/AdminPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import DeactivationModal from '../components/DeactivationModal';
import PageHeader from '../components/PageHeader'; // Importar
import Card from '../components/Card'; // Importar
import { API_URL } from '../config';

// (El componente UserDetailsModal no cambia, se mantiene igual)
const UserDetailsModal = ({ userId, onClose, token }) => { /* ...código sin cambios... */ };

const AdminPage = () => {
    const { token } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingUser, setDeletingUser] = useState(null);
    const [viewingUserId, setViewingUserId] = useState(null);
    const [deactivatingUser, setDeactivatingUser] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/users/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('No se pudo cargar la lista de usuarios.');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    // ... (lógica de handleToggleActive, handleConfirmDeactivation, confirmDelete sin cambios)

    const headerIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197M12 12.146V12" />
        </svg>
    );

    return (
        <div className="bg-gray-100 dark:bg-dark-bg-body min-h-screen">
            <PageHeader title="Panel de Administrador" icon={headerIcon}>
                <Link to="/dashboard" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Volver al Dashboard
                </Link>
            </PageHeader>
            <main className="p-4 sm:p-8">
                <Card className="max-w-4xl mx-auto">
                    {loading ? (
                        <LoadingSpinner message="Cargando usuarios..." />
                    ) : users.length === 0 ? (
                        // ESTADO VACÍO
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197M12 12.146V12" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay usuarios</h3>
                            <p className="mt-1 text-sm text-gray-500">Aún no se ha registrado ningún usuario en el sistema.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                {/* ... resto de la tabla sin cambios ... */}
                            </table>
                        </div>
                    )}
                </Card>
            </main>
            {/* ... Modales sin cambios ... */}
        </div>
    );
};

export default AdminPage;
