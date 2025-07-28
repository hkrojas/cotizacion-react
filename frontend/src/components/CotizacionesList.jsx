import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import EditModal from './EditModal';
import ConfirmModal from './ConfirmModal';
import LoadingSpinner from './LoadingSpinner';
import { API_URL } from '../config'; // 1. Importamos la URL de la API centralizada

const ActionIcon = ({ icon, color, onClick }) => (
    <button onClick={onClick} className={`p-2 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none ${color}`}>
        {icon}
    </button>
);

const CotizacionesList = ({ refreshTrigger }) => {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useContext(AuthContext);
    const [editingCotizacionId, setEditingCotizacionId] = useState(null);
    const [deletingCotizacionId, setDeletingCotizacionId] = useState(null);

    const fetchCotizaciones = async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            // Usamos la API_URL importada
            const response = await fetch(`${API_URL}/cotizaciones/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('No se pudieron cargar las cotizaciones.');
            const data = await response.json();
            setCotizaciones(data);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchCotizaciones();
    }, [token, refreshTrigger]);

    const handleDownloadPdf = async (cot) => {
        try {
            // Usamos la API_URL importada
            const response = await fetch(`${API_URL}/cotizaciones/${cot.id}/pdf`, {
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
        } catch (err) {
            setError(err.message);
        }
    };
    
    const handleDeleteClick = (cotizacionId) => {
        setDeletingCotizacionId(cotizacionId);
    };

    const confirmDelete = async () => {
        if (!deletingCotizacionId) return;
        try {
            // Usamos la API_URL importada
            const response = await fetch(`${API_URL}/cotizaciones/${deletingCotizacionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al eliminar la cotización.');
            fetchCotizaciones();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingCotizacionId(null);
        }
    };

    const handleEditSuccess = () => {
        setEditingCotizacionId(null);
        fetchCotizaciones();
    };

    const getCurrencySymbol = (moneda) => {
        if (moneda === 'SOLES') return 'S/';
        if (moneda === 'DOLARES') return '$';
        return '';
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Fecha inválida';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    const filteredCotizaciones = cotizaciones.filter(cot =>
        cot.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cot.numero_cotizacion.includes(searchTerm)
    );

    if (loading) {
        return <LoadingSpinner message="Cargando cotizaciones..." />;
    }
    
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    return (
        <>
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                        Mis Cotizaciones Guardadas
                    </h2>
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Buscar por cliente o N°..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                
                {filteredCotizaciones.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{searchTerm ? 'No se encontraron resultados' : 'Sin Cotizaciones'}</h3>
                        <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Intenta con otra búsqueda.' : 'Crea tu primera cotización para verla aquí.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow-md border dark:border-gray-700">
                        <table className="min-w-full bg-white dark:bg-gray-800">
                            {/* --- CABECERA DE TABLA MEJORADA --- */}
                            <thead className="bg-gray-100 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">N°</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Monto Total</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                                {filteredCotizaciones.map((cot) => (
                                    // --- FILAS CON COLORES ALTERNOS (EFECTO CEBRA) ---
                                    <tr key={cot.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 even:bg-gray-50 dark:even:bg-gray-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{cot.numero_cotizacion}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{cot.nombre_cliente}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(cot.fecha_creacion)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold">
                                            {getCurrencySymbol(cot.moneda)} {cot.monto_total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                                            <ActionIcon 
                                                onClick={() => handleDownloadPdf(cot)}
                                                color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900"
                                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
                                            />
                                            <ActionIcon 
                                                onClick={() => setEditingCotizacionId(cot.id)}
                                                color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"
                                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>} 
                                            />
                                            <ActionIcon 
                                                onClick={() => handleDeleteClick(cot.id)}
                                                color="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"
                                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} 
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {editingCotizacionId && (
                <EditModal 
                    cotizacionId={editingCotizacionId}
                    closeModal={() => setEditingCotizacionId(null)}
                    onUpdate={handleEditSuccess}
                />
            )}
            <ConfirmModal 
                isOpen={!!deletingCotizacionId}
                onClose={() => setDeletingCotizacionId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar esta cotización? Esta acción no se puede deshacer."
            />
        </>
    );
};

export default CotizacionesList;
