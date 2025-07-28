import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { API_URL } from '../config'; // 1. Importamos la URL de la API centralizada
import { parseApiError } from '../utils/apiUtils'; // 2. Importamos la función de utilidad

// 3. Eliminamos la función parseApiError que estaba duplicada aquí.

const ProfilePage = () => {
    const { user, token, updateUser } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);

    const [formData, setFormData] = useState({
        business_name: '', business_address: '', business_ruc: '',
        business_phone: '', primary_color: '#004aad',
        pdf_note_1: '', pdf_note_1_color: '#FF0000', pdf_note_2: '',
    });
    const [bankAccounts, setBankAccounts] = useState([]);
    const [lookupRuc, setLookupRuc] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [loadingConsulta, setLoadingConsulta] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                business_name: user.business_name || '',
                business_address: user.business_address || '',
                business_ruc: user.business_ruc || '',
                business_phone: user.business_phone || '',
                primary_color: user.primary_color || '#004aad',
                pdf_note_1: user.pdf_note_1 || 'TODO TRABAJO SE REALIZA CON EL 50% DE ADELANTO',
                pdf_note_1_color: user.pdf_note_1_color || '#FF0000',
                pdf_note_2: user.pdf_note_2 || 'LOS PRECIOS NO INCLUYEN ENVIOS',
            });
            setBankAccounts(Array.isArray(user.bank_accounts) && user.bank_accounts.length > 0 ? user.bank_accounts : []);
            setLookupRuc(user.business_ruc || '');
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setLogoFile(e.target.files[0]);
    };

    const handleBankAccountChange = (index, e) => {
        const { name, value } = e.target;
        const newAccounts = [...bankAccounts];
        newAccounts[index][name] = value;
        
        if (name === 'banco' && value.toLowerCase().includes('nación')) {
            newAccounts[index].tipo_cuenta = 'Cuenta Detracción';
        } else if (name === 'banco') {
            if (newAccounts[index].tipo_cuenta === 'Cuenta Detracción') {
                newAccounts[index].tipo_cuenta = 'Cta Ahorro';
            }
        }
        
        setBankAccounts(newAccounts);
    };

    const addBankAccount = () => {
        if (bankAccounts.length < 3) {
            setBankAccounts([...bankAccounts, { 
                banco: '', 
                tipo_cuenta: 'Cta Ahorro', 
                moneda: 'Soles', 
                cuenta: '', 
                cci: '' 
            }]);
        } else {
            addToast('Puedes agregar un máximo de 3 cuentas bancarias.', 'error');
        }
    };

    const removeBankAccount = (index) => {
        const newAccounts = bankAccounts.filter((_, i) => i !== index);
        setBankAccounts(newAccounts);
    };

    const handleConsultarNegocio = async () => {
        if (!lookupRuc) {
            addToast('Por favor, ingrese un RUC para buscar.', 'error');
            return;
        }
        setLoadingConsulta(true);
        try {
            // Usamos la API_URL importada
            const response = await fetch(`${API_URL}/consultar-documento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ tipo_documento: "RUC", numero_documento: lookupRuc })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'No se encontraron datos para el RUC.');
            }
            const data = await response.json();
            setFormData(prev => ({ ...prev, business_name: data.nombre, business_address: data.direccion, business_ruc: lookupRuc }));
            addToast('Datos del negocio encontrados y rellenados.', 'success');
        } catch (error) {
            addToast(`Error: ${error.message}`, 'error');
        } finally {
            setLoadingConsulta(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        const profileData = { ...formData, bank_accounts: bankAccounts };
        try {
            // Usamos la API_URL importada
            const response = await fetch(`${API_URL}/profile/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profileData),
            });
            if (!response.ok) {
                const errData = await response.json();
                // Usamos la función de utilidad importada
                const errorMessage = parseApiError(errData);
                throw new Error(errorMessage);
            }
            const updatedUser = await response.json();
            updateUser(updatedUser);
            addToast('Perfil guardado con éxito.', 'success');
        } catch (error) {
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleLogoSubmit = async (e) => {
        e.preventDefault();
        if (!logoFile) {
            addToast('Por favor, selecciona un archivo de logo.', 'error');
            return;
        }
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        try {
            // Usamos la API_URL importada
            const response = await fetch(`${API_URL}/profile/logo/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: logoFormData,
            });
            if (!response.ok) throw new Error('Error al subir el logo.');
            const updatedUser = await response.json();
            updateUser(updatedUser);
            addToast('Logo subido con éxito.', 'success');
        } catch (error) {
            addToast(`Error: ${error.message}`, 'error');
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
                    <form onSubmit={handleProfileSubmit} className="space-y-10">
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold border-b dark:border-gray-700 pb-2">Información del Negocio</h2>
                            <div className="flex space-x-2">
                                <input type="text" placeholder="Autocompletar con RUC..." value={lookupRuc} onChange={(e) => setLookupRuc(e.target.value)} className={inputStyles} />
                                <button 
                                    type="button" 
                                    onClick={handleConsultarNegocio} 
                                    disabled={loadingConsulta} 
                                    className="whitespace-nowrap bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-all duration-300 disabled:bg-indigo-400 shadow-md hover:shadow-lg active:scale-95"
                                >
                                    {loadingConsulta ? '...' : 'Buscar'}
                                </button>
                            </div>
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
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold border-b dark:border-gray-700 pb-2">Personalización del PDF</h2>
                            <div>
                                <label className={labelStyles}>Color Principal</label>
                                <input type="color" name="primary_color" value={formData.primary_color} onChange={handleChange} className="mt-1 block w-full h-10 rounded-md" />
                            </div>
                            <div>
                                <label className={labelStyles}>Nota 1 (Resaltada)</label>
                                <input name="pdf_note_1" value={formData.pdf_note_1} onChange={handleChange} className={inputStyles} />
                            </div>
                             <div>
                                <label className={labelStyles}>Color de Nota 1</label>
                                <input type="color" name="pdf_note_1_color" value={formData.pdf_note_1_color} onChange={handleChange} className="mt-1 block w-full h-10 rounded-md" />
                            </div>
                            <div>
                                <label className={labelStyles}>Nota 2</label>
                                <input name="pdf_note_2" value={formData.pdf_note_2} onChange={handleChange} className={inputStyles} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold border-b dark:border-gray-700 pb-2">Datos Bancarios</h2>
                            {bankAccounts.map((account, index) => {
                                const isBancoNacion = account.banco && account.banco.toLowerCase().includes('nación');
                                
                                return (
                                    <div key={index} className="p-4 border dark:border-gray-700 rounded-md space-y-3 relative">
                                        <h3 className="font-semibold">Cuenta {index + 1}</h3>
                                        {bankAccounts.length > 0 && (
                                            <button type="button" onClick={() => removeBankAccount(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-transform duration-200 hover:scale-125">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                            </button>
                                        )}
                                        <div>
                                            <label className={labelStyles}>Banco</label>
                                            <input name="banco" value={account.banco} onChange={(e) => handleBankAccountChange(index, e)} className={inputStyles} placeholder="Ej: Banco de la Nación"/>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelStyles}>Tipo de Cuenta</label>
                                                {isBancoNacion ? (
                                                    <input value="Cuenta Detracción" readOnly className={`${inputStyles} bg-gray-200 dark:bg-gray-800 cursor-not-allowed`} />
                                                ) : (
                                                    <select name="tipo_cuenta" value={account.tipo_cuenta} onChange={(e) => handleBankAccountChange(index, e)} className={inputStyles}>
                                                        <option value="Cta Ahorro">Cta Ahorro</option>
                                                        <option value="Cta Corriente">Cta Corriente</option>
                                                    </select>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelStyles}>Moneda</label>
                                                <select name="moneda" value={account.moneda} onChange={(e) => handleBankAccountChange(index, e)} className={inputStyles}>
                                                    <option value="Soles">Soles</option>
                                                    <option value="Dólares">Dólares</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelStyles}>Número de Cuenta</label>
                                            <input name="cuenta" value={account.cuenta} onChange={(e) => handleBankAccountChange(index, e)} className={inputStyles} placeholder="Ej: 00045115666"/>
                                        </div>
                                        <div>
                                            <label className={labelStyles}>CCI</label>
                                            <input name="cci" value={account.cci} onChange={(e) => handleBankAccountChange(index, e)} className={inputStyles} placeholder="Ej: 01804500004511566655"/>
                                        </div>
                                    </div>
                                )
                            })}
                            {bankAccounts.length < 3 && (
                                <button type="button" onClick={addBankAccount} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-bold py-2 px-4 rounded-md transition-all duration-200 active:scale-95">
                                    + Agregar Cuenta Bancaria
                                </button>
                            )}
                        </div>
                        
                        <button 
                            type="submit" 
                            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
                        >
                            Guardar Toda la Información
                        </button>
                    </form>

                    <hr className="dark:border-gray-700"/>

                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Logo del Negocio</h2>
                        {user && user.logo_filename && (
                            <div className="space-y-2">
                                <label className={labelStyles}>Logo Actual</label>
                                <div className="p-4 border border-dashed rounded-md">
                                    {/* Usamos la API_URL importada */}
                                    <img src={`${API_URL}/logos/${user.logo_filename}?t=${new Date().getTime()}`} alt="Logo del negocio" className="max-h-24 rounded-md"/>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleLogoSubmit} className="space-y-4">
                            <div>
                                <label className={labelStyles}>{user && user.logo_filename ? 'Reemplazar logo' : 'Subir logo (PNG o JPG)'}</label>
                                <input type="file" onChange={handleFileChange} accept="image/png, image/jpeg" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600" />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
                            >
                                Subir Logo
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
