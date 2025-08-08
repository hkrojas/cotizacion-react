// frontend/src/pages/DashboardPage.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';

const DashboardPage = () => {
    const { user, logout } = useContext(AuthContext);

    // --- ÍCONOS PARA LAS TARJETAS ---
    const headerIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    const invoiceIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    const ticketIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
    const creditNoteIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>;
    const guideIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>;
    const quoteIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

    // Componente reutilizable para las tarjetas de navegación
    const NavCard = ({ to, title, description, icon, bgColorClass }) => (
        <Link to={to} className="block group">
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300 transform hover:-translate-y-1 h-full">
                <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 p-3 ${bgColorClass} rounded-lg`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                    </div>
                </div>
            </Card>
        </Link>
    );

    return (
        <div className="bg-gray-100 dark:bg-dark-bg-body min-h-screen transition-colors duration-300">
            <PageHeader title="Panel Principal" icon={headerIcon}>
                {user && (
                    <div className="flex items-center space-x-4">
                        <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">Bienvenido, <strong>{user.email}</strong></span>
                        {user.is_admin && (
                            <Link to="/admin" className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                                Admin
                            </Link>
                        )}
                        <Link to="/profile" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            Mi Perfil
                        </Link>
                        <Button onClick={logout} variant="danger">
                            Cerrar Sesión
                        </Button>
                    </div>
                )}
            </PageHeader>
            
            <main className="p-4 sm:p-8">
                <div className="w-full max-w-6xl mx-auto">
                    {/* Sección de Facturación Electrónica */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Facturación Electrónica</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <NavCard 
                                to="/comprobantes?tab=facturas"
                                title="Facturas"
                                description="Gestiona tus facturas electrónicas."
                                icon={invoiceIcon}
                                bgColorClass="bg-blue-100 dark:bg-blue-900/50"
                            />
                             <NavCard 
                                to="/comprobantes?tab=boletas"
                                title="Boletas de Venta"
                                description="Emite y consulta tus boletas."
                                icon={ticketIcon}
                                bgColorClass="bg-green-100 dark:bg-green-900/50"
                            />
                            <NavCard 
                                to="/comprobantes?tab=notas"
                                title="Notas de Crédito"
                                description="Crea notas para tus comprobantes."
                                icon={creditNoteIcon}
                                bgColorClass="bg-yellow-100 dark:bg-yellow-900/50"
                            />
                            <NavCard 
                                to="/guias" // Esta ruta se mantiene para una futura implementación
                                title="Guías de Remisión"
                                description="Gestiona el traslado de bienes."
                                icon={guideIcon}
                                bgColorClass="bg-red-100 dark:bg-red-900/50"
                            />
                        </div>
                    </div>

                    {/* Sección de Cotizaciones */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Gestión Comercial</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                           <NavCard 
                                to="/cotizaciones"
                                title="Cotizaciones"
                                description="Crea, edita y envía propuestas."
                                icon={quoteIcon}
                                bgColorClass="bg-purple-100 dark:bg-purple-900/50"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
