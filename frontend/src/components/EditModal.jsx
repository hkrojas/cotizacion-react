import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import ClientForm from './ClientForm';
import ProductsTable from './ProductsTable';
import LoadingSpinner from './LoadingSpinner';
import { API_URL } from '../config'; // 1. Importamos la URL de la API centralizada
import { parseApiError } from '../utils/apiUtils'; // 2. Importamos la función de utilidad

// 3. Eliminamos la función parseApiError que estaba duplicada aquí.

const EditModal = ({ cotizacionId, closeModal, onUpdate }) => {
    const { token } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const [clientData, setClientData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!cotizacionId) return;
        const fetchCotizacionData = async () => {
            setLoading(true);
            try {
                // Usamos la API_URL importada
                const response = await fetch(`${API_URL}/cotizaciones/${cotizacionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('No se pudieron cargar los datos de la cotización.');
                const data = await response.json();
                setClientData({
                    nombre_cliente: data.nombre_cliente,
                    direccion_cliente: data.direccion_cliente,
                    tipo_documento: data.tipo_documento,
                    nro_documento: data.nro_documento,
                    moneda: data.moneda,
                });
                setProducts(data.productos.map(p => ({...p, total: p.unidades * p.precio_unitario})));
            } catch (err) {
                addToast(err.message, 'error');
                closeModal(); // Cierra el modal si hay un error al cargar
            } finally {
                setLoading(false);
            }
        };
        fetchCotizacionData();
    }, [cotizacionId, token, addToast, closeModal]);

    const handleClientChange = (e) => {
        const { name, value } = e.target;
        setClientData(prev => ({ ...prev, [name]: value }));
    };

    const handleProductChange = (index, e) => {
        const { name, value } = e.target;
        const newProducts = [...products];
        const product = newProducts[index];
        product[name] = value;
        const unidades = parseFloat(product.unidades) || 0;
        const precioUnitario = parseFloat(product.precio_unitario) || 0;
        product.total = unidades * precioUnitario;
        setProducts(newProducts);
    };

    const addProduct = () => {
        setProducts([...products, { descripcion: '', unidades: 1, precio_unitario: 0, total: 0 }]);
    };

    const removeProduct = (index) => {
        const newProducts = products.filter((_, i) => i !== index);
        setProducts(newProducts);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const monto_total = products.reduce((sum, p) => sum + p.total, 0);
        const cotizacionData = { ...clientData, monto_total, productos: products.map(p => ({...p, unidades: parseInt(p.unidades) || 0, precio_unitario: parseFloat(p.precio_unitario) || 0}))};
        
        try {
            // Usamos la API_URL importada
            const response = await fetch(`${API_URL}/cotizaciones/${cotizacionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(cotizacionData)
            });
            if (!response.ok) {
                const errData = await response.json();
                // Usamos la función de utilidad importada
                const errorMessage = parseApiError(errData);
                throw new Error(errorMessage);
            }
            addToast('¡Cotización actualizada con éxito!', 'success');
            onUpdate();
            closeModal();
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const renderContent = () => {
        if (loading) {
            return <LoadingSpinner message="Cargando datos de la cotización..." />;
        }
        if (clientData) {
            return (
                <>
                    <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            Editar Cotización <span className="text-blue-600 dark:text-blue-400">N° {cotizacionId}</span>
                        </h2>
                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <ClientForm clientData={clientData} handleClientChange={handleClientChange} />
                        <ProductsTable products={products} handleProductChange={handleProductChange} addProduct={addProduct} removeProduct={removeProduct} />
                        <div className="mt-8 flex justify-end gap-4 border-t pt-6 dark:border-gray-700">
                            <button type="button" onClick={closeModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-md transition dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200">
                                Cancelar
                            </button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition shadow-md hover:shadow-lg">
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </>
            );
        }
        return null;
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={closeModal}
        >
            <div 
                className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                {renderContent()}
            </div>
        </div>
    );
};

export default EditModal;
