import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const ProfilePage = () => {
    const { user, token, updateUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        business_name: '',
        business_address: '',
        business_ruc: '',
        business_phone: '',
        primary_color: '#004aad',
    });
    const [lookupRuc, setLookupRuc] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [message, setMessage] = useState('');
    const [loadingConsulta, setLoadingConsulta] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                business_name: user.business_name || '',
                business_address: user.business_address || '',
                business_ruc: user.business_ruc || '',
                business_phone: user.business_phone || '',
                primary_color: user.primary_color || '#004aad',
            });
            setLookupRuc(user.business_ruc || '');
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setLogoFile(e.target.files[0]);
    };

    const handleConsultarNegocio = async () => {
        if (!lookupRuc) {
            setMessage('Por favor, ingrese un RUC para buscar.');
            return;
        }
        setLoadingConsulta(true);
        setMessage('Buscando información del RUC...');
        try {
            const response = await fetch('http://127.0.0.1:8000/consultar-documento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    tipo_documento: "RUC",
                    numero_documento: lookupRuc
                })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'No se encontraron datos para el RUC.');
            }
            const data = await response.json();
            setFormData(prev => ({
                ...prev,
                business_name: data.nombre,
                business_address: data.direccion,
                business_ruc: lookupRuc
            }));
            setMessage('Datos del negocio encontrados y rellenados.');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoadingConsulta(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage('Guardando perfil...');
        try {
            const response = await fetch('http://127.0.0.1:8000/profile/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error('Error al guardar el perfil.');
            const updatedUser = await response.json();
            updateUser(updatedUser);
            setMessage('Perfil guardado con éxito.');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    const handleLogoSubmit = async (e) => {
        e.preventDefault();
        if (!logoFile) {
            setMessage('Por favor, selecciona un archivo de logo.');
            return;
        }
        setMessage('Subiendo logo...');
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        try {
            const response = await fetch('http://127.0.0.1:8000/profile/logo/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: logoFormData,
            });
            if (!response.ok) throw new Error('Error al subir el logo.');
            const updatedUser = await response.json();
            updateUser(updatedUser);
            setMessage('Logo subido con éxito.');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    const inputStyles = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";
    const labelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
                                Mi Perfil de Negocio
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                             <ThemeToggle />
                             <Link to="/dashboard" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300 transform hover:scale-105">
                                Volver al Dashboard
                             </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-8">
                <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-10 text-gray-800 dark:text-gray-200">
                    
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Autocompletar con RUC</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ingresa el RUC de tu negocio para rellenar automáticamente el nombre y la dirección.</p>
                        <div className="flex space-x-2">
                            <input 
                                type="text" 
                                placeholder="Ingrese RUC aquí..."
                                value={lookupRuc}
                                onChange={(e) => setLookupRuc(e.target.value)}
                                className={inputStyles}
                            />
                            <button 
                                type="button" 
                                onClick={handleConsultarNegocio} 
                                disabled={loadingConsulta} 
                                className="whitespace-nowrap bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-400">
                                {loadingConsulta ? 'Buscando...' : 'Buscar mi Negocio'}
                            </button>
                        </div>
                    </div>

                    <hr className="dark:border-gray-700"/>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <h2 className="text-xl font-semibold">Información del Negocio</h2>
                        <div>
                            <label className={labelStyles}>Nombre del Negocio</label>
                            <input name="business_name" value={formData.business_name} onChange={handleChange} className={inputStyles} />
                        </div>
                        <div>
                            <label className={labelStyles}>Dirección</label>
                            <input name="business_address" value={formData.business_address} onChange={handleChange} className={inputStyles} />
                        </div>
                        <div>
                            <label className={labelStyles}>RUC</label>
                            <input name="business_ruc" value={formData.business_ruc} onChange={handleChange} className={inputStyles} />
                        </div>
                        <div>
                            <label className={labelStyles}>Teléfono</label>
                            <input name="business_phone" value={formData.business_phone} onChange={handleChange} className={inputStyles} />
                        </div>
                        <div>
                            <label className={labelStyles}>Color Principal (para PDF)</label>
                            <input type="color" name="primary_color" value={formData.primary_color} onChange={handleChange} className="mt-1 block w-full h-10 rounded-md" />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold">Guardar Información</button>
                    </form>

                    <hr className="dark:border-gray-700"/>

                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Logo del Negocio</h2>
                        {user && user.logo_filename && (
                            <div className="space-y-2">
                                <label className={labelStyles}>Logo Actual</label>
                                <div className="p-4 border border-dashed rounded-md">
                                    <img 
                                        src={`http://127.0.0.1:8000/logos/${user.logo_filename}?t=${new Date().getTime()}`} 
                                        alt="Logo del negocio" 
                                        className="max-h-24 rounded-md"
                                    />
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleLogoSubmit} className="space-y-4">
                            <div>
                                <label className={labelStyles}>
                                    {user && user.logo_filename ? 'Subir nuevo logo para reemplazar' : 'Subir logo (PNG o JPG)'}
                                </label>
                                <input type="file" onChange={handleFileChange} accept="image/png, image/jpeg" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600" />
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-semibold">Subir Logo</button>
                        </form>
                    </div>

                    {message && <p className="text-center font-semibold mt-4 text-indigo-600 dark:text-indigo-400">{message}</p>}
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
