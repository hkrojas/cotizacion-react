import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const response = await fetch(`${API_URL}/users/me/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        // Si el token es inválido, lo limpiamos
                        throw new Error('Token inválido o expirado');
                    }
                    const data = await response.json();
                    setUser(data);
                } catch (error) {
                    console.error("Auth Error:", error.message);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setLoading(true); // Forzar recarga de datos de usuario
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedUserData) => {
        setUser(prevUser => ({...prevUser, ...updatedUserData}));
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
