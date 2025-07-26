import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// --- USANDO VARIABLES DE ENTORNO PARA LA URL DE LA API ---
// Vite usa `import.meta.env.VITE_` para las variables de entorno.
// Crearemos un archivo .env en el frontend para desarrollo.
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetch(`${API_URL}/users/me/`, { // Usamos la variable API_URL
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                if (!response.ok) {
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                    return Promise.reject('Token inválido');
                }
                return response.json();
            })
            .then(data => setUser(data))
            .catch(() => {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            })
            .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
