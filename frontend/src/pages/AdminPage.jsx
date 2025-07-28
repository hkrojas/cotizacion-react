import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import { API_URL } from '../config'; // 1. Importamos la URL de la API centralizada

// --- COMPONENTE: MODAL DE DETALLES DE USUARIO ---
const UserDetailsModal = ({ userId, onClose, token }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useContext(ToastContext);

    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true);
            try {
                // Usamos la API_URL importada
                const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('No se pudieron cargar los detalles del usuario.');
                const data = await response.json();
                setUserData(data);
            } catch (err) {
                addToast(err.message, 'error');
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchUserDetails();
    }, [userId, token, onClose, addToast]);

    const handleDownloadPdf = async (cot) => {
        try {
            // Usa el nuevo endpoint de admin para descargar el PDF
            const response = await fetch(`${API_URL}/admin/cotizaciones/${cot.id}/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al generar el PDF.');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const sanitizedClientName = cot.nombre_cliente.replace(/ /g, '_').replace(/[\\/*?:"<>|]/g, '');
            a.download = `Cotizacion_${cot.numero_cotizacion}_${sanitizedClientName}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url); // Limpia la URL del objeto
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Detalles del Usuario</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl">&times;</button>
                </div>
                {loading ? (
                    <LoadingSpinner message="Cargando detalles..." />
                ) : userData ? (
                    <div className="mt-4 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-lg">Información del Negocio</h4>
                                <p><strong>Email:</strong> {userData.email}</p>
                                <p><strong>Nombre:</strong> {userData.business_name || 'No especificado'}</p>
                                <p><strong>RUC:</strong> {userData.business_ruc || 'No especificado'}</p>
                                <p><strong>Dirección:</strong> {userData.business_address || 'No especificado'}</p>
                                <p><strong>Teléfono:</strong> {userData.business_phone || 'No especificado'}</p>
                            </div>
                            {userData.logo_filename && (
                                <div className="space-y-2">
                                     <h4 className="font-semibold text-lg">Logo</h4>
                                     <div className="p-2 border border-dashed rounded-md inline-block">
                                        <img src={`${API_URL}/logos/${userData.logo_filename}`} alt="Logo" className="max-h-20"/>
                                     </div>
                                     <a
                                        href={`${API_URL}/logos/${userData.logo_filename}`}
                                        download
                                        className="mt-2 inline-block px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                                     >
                                         Descargar Logo
                                     </a>
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg mt-6 border-t pt-4 dark:border-gray-700">Cotizaciones ({userData.cotizaciones.length})</h4>
                            {userData.cotizaciones.length > 0 ? (
                                <ul className="divide-y dark:divide-gray-700">
                                    {userData.cotizaciones.map(cot => (
                                        <li key={cot.id} className="py-2 flex justify-between items-center">
                                            <div>
                                                <span>N° {cot.numero_cotizacion} - {cot.nombre_cliente}</span>
                                                <span className="block text-xs text-gray-500">{formatDate(cot.fecha_creacion)}</span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="font-semibold">{cot.moneda === 'SOLES' ? 'S/' : '$'} {cot.monto_total.toFixed(2)}</span>
                                                <button onClick={() => handleDownloadPdf(cot)} className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800">
                                                    PDF
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">Este usuario no tiene cotizaciones.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p>No se pudieron cargar los datos.</p>
                )}
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA DE ADMIN ---
const AdminPage = () => {
    const { token } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingUser, setDeletingUser] = useState(null);
    const [viewingUserId, setViewingUserId] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Usamos la API_URL importada
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

    const handleToggleActive = async (user) => {
        try {
            // Usamos la API_URL importada
            const response = await fetch(`${API_URL}/admin/users/${user.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !user.is_active })
            });
            if (!response.ok) throw new Error('Error al cambiar el estado del usuario.');
            addToast(`Usuario ${user.email} ${!user.is_active ? 'activado' : 'desactivado'}.`, 'success');
            fetchUsers();
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deletingUser) return;
        try {
            // Usamos la API_URL importada
            const response = await fetch(`${API_URL}/admin/users/${deletingUser.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al eliminar el usuario.');
            addToast(`Usuario ${deletingUser.email} eliminado.`, 'success');
            setDeletingUser(null);
            fetchUsers();
        } catch (err) {
            addToast(err.message, 'error');
            setDeletingUser(null);
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-dark-bg-body min-h-screen">
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Panel de Administrador</h1>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <Link to="/dashboard" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                Volver al Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
            <main className="p-4 sm:p-8">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                    {loading ? (
                        <LoadingSpinner message="Cargando usuarios..." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.email} {user.is_admin && <span className="text-xs font-bold text-blue-500">(Admin)</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center space-x-2">
                                                <button onClick={() => setViewingUserId(user.id)} className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800">
                                                    Ver Detalles
                                                </button>
                                                {!user.is_admin && (
                                                    <>
                                                        <button onClick={() => handleToggleActive(user)} className={`px-3 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800' : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'}`}>
                                                            {user.is_active ? 'Desactivar' : 'Activar'}
                                                        </button>
                                                        <button onClick={() => setDeletingUser(user)} className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800">
                                                            Eliminar
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
            <ConfirmModal
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={confirmDelete}
                title="Eliminar Usuario"
                message={`¿Estás seguro de que quieres eliminar la cuenta de ${deletingUser?.email}? Esta acción no se puede deshacer.`}
            />
            {viewingUserId && (
                <UserDetailsModal userId={viewingUserId} onClose={() => setViewingUserId(null)} token={token} />
            )}
        </div>
    );
};

export default AdminPage;
