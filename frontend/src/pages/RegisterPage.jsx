import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import UserIcon from '../components/UserIcon';
import LockIcon from '../components/LockIcon';
import { ToastContext } from '../context/ToastContext';
import { API_URL } from '../context/AuthContext';

const parseApiError = (errorData) => {
    if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
            return errorData.detail;
        }
        if (Array.isArray(errorData.detail)) {
            return errorData.detail.map(err => `${err.loc[1]}: ${err.msg}`).join('; ');
        }
    }
    return 'Ocurrió un error desconocido.';
};

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errData = await response.json();
                const errorMessage = parseApiError(errData);
                throw new Error(errorMessage);
            }
            
            addToast('¡Registro exitoso! Por favor, inicia sesión.', 'success');
            navigate('/login');

        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    return (
        <AuthLayout title="Crear Cuenta">
            <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            El correo electrónico que uses para el registro será visible en las cotizaciones que generes.
                        </p>
                    </div>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-md py-3 px-4">
                    <UserIcon />
                    <input 
                        id="email"
                        name="email"
                        type="email" 
                        autoComplete="email"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        placeholder="Ingrese su email"
                        className="bg-transparent border-none outline-none w-full text-gray-800 dark:text-gray-200"
                    />
                </div>
                <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-md py-3 px-4">
                    <LockIcon />
                    <input 
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        placeholder="Cree una contraseña"
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
                    Registrarse
                </button>
            </form>
            <p className="text-center mt-4 text-sm text-gray-700 dark:text-gray-300">
                ¿Ya tienes una cuenta? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Inicia sesión</Link>
            </p>
        </AuthLayout>
    );
};

export default RegisterPage;
