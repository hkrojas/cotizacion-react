import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import UserIcon from '../components/UserIcon';
import LockIcon from '../components/LockIcon';
import { ToastContext } from '../context/ToastContext';
import { API_URL } from '../context/AuthContext'; // Importar API_URL

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);
    const { addToast } = useContext(ToastContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        try {
            const response = await fetch(`${API_URL}/token`, { // Usar API_URL
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Email o contraseña incorrectos.');
            }
            const data = await response.json();
            login(data.access_token);
            addToast('¡Inicio de sesión exitoso!', 'success');
            navigate('/dashboard');
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    return (
        <AuthLayout title="Iniciar Sesión">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-md py-3 px-4">
                    <UserIcon />
                    <input 
                        type="email" 
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
                        type={showPassword ? 'text' : 'password'}
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
                {/* --- BOTÓN MEJORADO --- */}
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
    );
};

export default LoginPage;