// frontend/src/pages/DashboardPage.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';

const DashboardPage = () => {
    const { user, logout } = useContext(AuthContext);

    const headerIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    );

    const NavCard = ({ to, title, description, icon }) => (
        <Link to={to} className="block group">
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300 transform hover:-translate-y-1">
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
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
                <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <NavCard 
                        to="/comprobantes"
                        title="Facturación Electrónica"
                        description="Crea y gestiona tus facturas, boletas y notas."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    />
                    <NavCard 
                        to="/cotizaciones"
                        title="Cotizaciones"
                        description="Crea, gestiona y convierte tus cotizaciones."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    />
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
