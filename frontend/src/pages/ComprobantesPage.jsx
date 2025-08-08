// frontend/src/pages/ComprobantesPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import ComprobantesList from '../components/ComprobantesList';

const ComprobantesPage = () => {
    const [activeTab, setActiveTab] = useState('facturas'); // Pestaña inicial: Facturas
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleCreationSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('facturas'); // Volver a la lista de facturas después de crear
    };

    const tabStyle = "px-6 py-3 font-semibold text-base border-b-2 transition-colors duration-300 focus:outline-none";
    const activeTabStyle = "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400";
    const inactiveTabStyle = "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200";

    const headerIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );

    return (
        <div className="bg-gray-100 dark:bg-dark-bg-body min-h-screen transition-colors duration-300">
            <PageHeader title="Facturación Electrónica" icon={headerIcon}>
                <Link to="/dashboard" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Volver al Panel
                </Link>
            </PageHeader>
            
            <main className="p-4 sm:p-8">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="flex border-b border-gray-300 dark:border-gray-700">
                        <button onClick={() => setActiveTab('facturas')} className={`${tabStyle} ${activeTab === 'facturas' ? activeTabStyle : inactiveTabStyle}`}>
                            Facturas
                        </button>
                        <button onClick={() => setActiveTab('boletas')} className={`${tabStyle} ${activeTab === 'boletas' ? activeTabStyle : inactiveTabStyle}`}>
                            Boletas
                        </button>
                        <button onClick={() => setActiveTab('notas')} className={`${tabStyle} ${activeTab === 'notas' ? activeTabStyle : inactiveTabStyle}`}>
                            Notas de Crédito
                        </button>
                         <button onClick={() => setActiveTab('crear')} className={`${tabStyle} ${activeTab === 'crear' ? activeTabStyle : inactiveTabStyle}`}>
                            Crear Comprobante
                        </button>
                    </div>
                    <Card className="rounded-t-none">
                        {activeTab === 'facturas' && <ComprobantesList tipoDoc="01" refreshTrigger={refreshTrigger} />}
                        {activeTab === 'boletas' && <ComprobantesList tipoDoc="03" refreshTrigger={refreshTrigger} />}
                        {activeTab === 'notas' && <div className="text-center py-12 text-gray-500"><p>La gestión de Notas de Crédito estará disponible próximamente.</p></div>}
                        {activeTab === 'crear' && <div className="text-center py-12 text-gray-500"><p>El formulario para crear comprobantes directamente estará disponible próximamente.</p></div>}
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default ComprobantesPage;
