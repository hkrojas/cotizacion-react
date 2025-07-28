import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import UserIcon from '../components/UserIcon';
import LockIcon from '../components/LockIcon';
import { ToastContext } from '../context/ToastContext';
import { API_URL } from '../config';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    // --- NUEVO ESTADO PARA LA VENTANA DE ERROR ---
    const [deactivationError, setDeactivationError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        try {
            const response = await fetch(`${API_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Email o contraseña incorrectos.');
            }

            login(data.access_token);
            addToast('¡Inicio de sesión exitoso!', 'success');
            navigate('/dashboard');
        } catch (err) {
            // --- LÓGICA MODIFICADA ---
            // Si el mensaje de error es sobre una cuenta desactivada, mostramos la ventana.
            // Si no, mostramos el toast normal.
            if (err.message && err.message.includes('Su cuenta ha sido desactivada')) {
                setDeactivationError(err.message);
            } else {
                addToast(err.message, 'error');
            }
        }
    };

    return (
        <>
            <AuthLayout title="Iniciar Sesión">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-md py-3 px-4">
                        <UserIcon />
                        <input 
                            id="email"
                            name="email"
                            type="email" 
                            autoComplete="username"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            placeholder="Ingrese su usuario"
                            className="bg-transparent border-none outline-none w-full text-gray-800 dark:text-gray-200"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-md py-3 px-4">
                        <LockIcon />
                        <input 
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="Ingrese su contraseña"
                            className="bg-transparent border-none outline-none w-full text-gray-800 dark:text-gray-200"
                        />
                        <svg onClick={() => setShowPassword(!showPassword)} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-500 dark:hover:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                            {showPassword ? (
                               <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 6.957 14.525 4.5 10 4.5c-1.756 0-3.41.59-4.815 1.561L3.707 2.293zM10.707 10.707a2 2 0 00-2.828-2.828l2.828 2.828zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            ) : (
                               <>
                                   <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                   <path fillRule="evenodd" d="M.458 10C1.73 6.957 5.475 4.5 10 4.5s8.27 2.457 9.542 5.5c-1.272 3.043-5.068 5.5-9.542 5.5S1.73 13.043.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                               </>
                            )}
                        </svg>
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-md transition-all duration-300 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
                    >
                        Iniciar sesión
                    </button>
                </form>
                <p className="text-center mt-4 text-sm text-gray-700 dark:text-gray-300">
                    ¿No tienes una cuenta? <Link to="/register" className="text-blue-600 hover:underline font-semibold">Regístrate aquí</Link>
                </p>
            </AuthLayout>

            {/* --- NUEVA VENTANA DE ERROR A PANTALLA COMPLETA --- */}
            {deactivationError && (
                <div className="fixed inset-0 bg-red-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md text-center transform transition-all animate-slide-in-up">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/50 mb-6">
                            <svg className="h-10 w-10 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Acceso Denegado
                        </h3>
                        <div className="mt-4">
                            <p className="text-md text-gray-600 dark:text-gray-300">
                                {deactivationError}
                            </p>
                        </div>
                        <div className="mt-8">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-3 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-lg"
                                onClick={() => setDeactivationError(null)}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LoginPage;
