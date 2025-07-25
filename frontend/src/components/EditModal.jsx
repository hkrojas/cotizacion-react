import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ClientForm from './ClientForm';
import ProductsTable from './ProductsTable';
import LoadingSpinner from './LoadingSpinner';

const EditModal = ({ cotizacionId, closeModal, onUpdate }) => {
    const { token } = useContext(AuthContext);
    const [clientData, setClientData] = useState(null);
    const [products, setProducts] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!cotizacionId) return;
        const fetchCotizacionData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`http://127.0.0.1:8000/cotizaciones/${cotizacionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('No se pudieron cargar los datos.');
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
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCotizacionData();
    }, [cotizacionId, token]);

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
        setStatusMessage('Actualizando cotización...');
        const monto_total = products.reduce((sum, p) => sum + p.total, 0);
        const cotizacionData = { ...clientData, monto_total, productos: products.map(p => ({...p, unidades: parseInt(p.unidades) || 0, precio_unitario: parseFloat(p.precio_unitario) || 0}))};
        try {
            const response = await fetch(`http://127.0.0.1:8000/cotizaciones/${cotizacionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(cotizacionData)
            });
            if (!response.ok) throw new Error('Error al actualizar.');
            setStatusMessage('¡Actualizado con éxito!');
            onUpdate();
            setTimeout(closeModal, 1500);
        } catch (err) {
            setStatusMessage(`Error: ${err.message}`);
        }
    };

    const renderContent = () => {
        if (loading) {
            return <LoadingSpinner message="Cargando datos de la cotización..." />;
        }
        if (error) {
            return <p className="text-center text-red-500 p-8">{error}</p>;
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
                    {statusMessage && <p className="mt-4 text-center font-semibold text-blue-600 dark:text-blue-400">{statusMessage}</p>}
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
