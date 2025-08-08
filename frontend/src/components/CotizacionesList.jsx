// frontend/src/components/CotizacionesList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import EditModal from './EditModal';
import ConfirmModal from './ConfirmModal';
import LoadingSpinner from './LoadingSpinner';
import Button from './Button';
import { API_URL } from '../config';
import { parseApiError } from '../utils/apiUtils';

const FacturaDetailsModal = ({ cotizacion, onClose, token }) => {
    const { addToast } = useContext(ToastContext);
    const [downloading, setDownloading] = useState(null);

    // Función para formatear la fecha y hora
    const formatDateTime = (dateString) => {
        if (!dateString) return 'No disponible';
        const date = new Date(dateString);
        return date.toLocaleString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const downloadFile = async (docType) => {
        // Deshabilitamos temporalmente la descarga de XML
        if (docType === 'xml') {
            addToast('La descarga de XML no está implementada todavía.', 'info');
            return;
        }

        setDownloading(docType);
        try {
            const endpoint = `/facturacion/${docType}`;
            
            // --- CORRECCIÓN CLAVE ---
            // Enviamos el ID del comprobante, no de la cotización.
            const payload = { comprobante_id: cotizacion.comprobante.id };

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                // --- CORRECCIÓN DE ERROR [object Object] ---
                throw new Error(errData.detail || `Error al descargar ${docType.toUpperCase()}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const extension = docType === 'cdr' ? 'zip' : docType;
            a.download = `Comprobante_${cotizacion.comprobante.serie}-${cotizacion.comprobante.correlativo}.${extension}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            // Mostramos el mensaje de error correcto
            addToast(err.message, 'error');
        } finally {
            setDownloading(null);
        }
    };

    const sunatResponse = cotizacion.comprobante?.sunat_response;
    const cdrResponse = sunatResponse?.cdrResponse;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 border-b pb-2">
                    Detalles del Comprobante N° {cotizacion.comprobante?.serie}-{cotizacion.comprobante?.correlativo}
                </h2>
                {sunatResponse ? (
                    <div className="space-y-4">
                        {/* --- NUEVO CAMPO: FECHA Y HORA --- */}
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Emisión:</p>
                            <p className="font-semibold text-gray-700 dark:text-gray-300">{formatDateTime(cotizacion.comprobante?.fecha_emision)}</p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Respuesta SUNAT:</h3>
                            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                                <p><strong>Éxito:</strong> {sunatResponse.success ? 'Sí' : 'No'}</p>
                                {cdrResponse && (
                                    <>
                                        <p><strong>Código CDR:</strong> {cdrResponse.id}</p>
                                        <p><strong>Descripción:</strong> {cdrResponse.description}</p>
                                        {cdrResponse.notes && <p><strong>Notas:</strong> {cdrResponse.notes.join(', ')}</p>}
                                    </>
                                )}
                                {sunatResponse.error && <p className="text-red-500"><strong>Error:</strong> {sunatResponse.error.message}</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Descargas:</h3>
                            <div className="mt-2 flex space-x-3">
                                <Button onClick={() => downloadFile('pdf')} loading={downloading === 'pdf'} variant="secondary">PDF</Button>
                                <Button onClick={() => downloadFile('xml')} loading={downloading === 'xml'} variant="secondary">XML</Button>
                                {cdrResponse && <Button onClick={() => downloadFile('cdr')} loading={downloading === 'cdr'} variant="secondary">CDR (ZIP)</Button>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p>No hay detalles de SUNAT disponibles.</p>
                )}
                <div className="mt-6 text-right">
                    <Button onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </div>
    );
};


const ActionIcon = ({ icon, color, onClick, disabled = false, tooltip }) => (
    <div className="relative group flex justify-center">
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`p-2 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none ${color} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {icon}
        </button>
        {tooltip && <span className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">{tooltip}</span>}
    </div>
);

const CotizacionesList = ({ refreshTrigger }) => {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [facturandoId, setFacturandoId] = useState(null);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const [editingCotizacionId, setEditingCotizacionId] = useState(null);
    const [deletingCotizacionId, setDeletingCotizacionId] = useState(null);
    const [viewingFactura, setViewingFactura] = useState(null);

    const fetchCotizaciones = async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
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

    const handleFacturar = async (cotizacionId) => {
        setFacturandoId(cotizacionId);
        try {
            const response = await fetch(`${API_URL}/cotizaciones/${cotizacionId}/facturar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Error al procesar la facturación.');
            }
            if (data.success) {
                addToast('¡Factura enviada a SUNAT con éxito!', 'success');
            } else {
                const sunatError = data.sunat_response?.error?.message || 'Error desconocido de SUNAT.';
                addToast(`Factura rechazada: ${sunatError}`, 'error');
            }
            fetchCotizaciones();
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setFacturandoId(null);
        }
    };

    const handleDownloadPdf = async (cot) => {
        try {
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
            const response = await fetch(`${API_URL}/cotizaciones/${deletingCotizacionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al eliminar la cotización.');
            addToast('Cotización eliminada.', 'success');
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

    const getCurrencySymbol = (moneda) => (moneda === 'SOLES' ? 'S/' : '$');
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES');

    const filteredCotizaciones = cotizaciones.filter(cot =>
        cot.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cot.numero_cotizacion.includes(searchTerm)
    );

    if (loading) return <LoadingSpinner message="Cargando cotizaciones..." />;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    return (
        <>
            {viewingFactura && <FacturaDetailsModal cotizacion={viewingFactura} onClose={() => setViewingFactura(null)} token={token} />}
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Mis Cotizaciones Guardadas</h2>
                    <div className="relative">
                        <input type="text" placeholder="Buscar por cliente o N°..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-gray-800 dark:text-gray-200" />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                            <thead className="bg-gray-100 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">N°</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                                {filteredCotizaciones.map((cot) => (
                                    <tr key={cot.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 even:bg-gray-50 dark:even:bg-gray-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{cot.numero_cotizacion}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{cot.nombre_cliente}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(cot.fecha_creacion)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold">{getCurrencySymbol(cot.moneda)} {cot.monto_total.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {cot.comprobante ? (
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cot.comprobante.success ? 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-300'}`}>
                                                    {cot.comprobante.success ? 'Facturado' : 'Rechazado'}
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300">Pendiente</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center items-center space-x-2">
                                                {cot.comprobante && (
                                                    <ActionIcon tooltip="Ver Detalles" onClick={() => setViewingFactura(cot)} color="bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-900" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
                                                )}
                                                <ActionIcon onClick={() => handleFacturar(cot.id)} disabled={!!cot.comprobante || facturandoId === cot.id} tooltip={cot.comprobante ? "Ya facturado" : "Emitir Factura/Boleta"} color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900" icon={facturandoId === cot.id ? <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-purple-400"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                                                <ActionIcon tooltip="Descargar Cotización (PDF)" onClick={() => handleDownloadPdf(cot)} color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>} />
                                                <ActionIcon tooltip="Editar" onClick={() => setEditingCotizacionId(cot.id)} color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>} />
                                                <ActionIcon tooltip="Eliminar" onClick={() => handleDeleteClick(cot.id)} color="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {editingCotizacionId && <EditModal cotizacionId={editingCotizacionId} closeModal={() => setEditingCotizacionId(null)} onUpdate={handleEditSuccess} />}
            <ConfirmModal isOpen={!!deletingCotizacionId} onClose={() => setDeletingCotizacionId(null)} onConfirm={confirmDelete} title="Confirmar Eliminación" message="¿Estás seguro de que quieres eliminar esta cotización? Esta acción no se puede deshacer." />
        </>
    );
};

export default CotizacionesList;
