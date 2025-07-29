import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// --- IMPORTS MODIFICADOS PARA ADMIN ---
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminPage from './pages/AdminPage'; // AdminPage ahora es el layout con rutas anidadas

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner message="Verificando sesión..." fullScreen={true} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      {/* --- RUTA DE ADMIN MODIFICADA PARA ACEPTAR SUB-RUTAS --- */}
      <Route 
        path="/admin/*" // El '/*' es clave para las rutas anidadas
        element={
          <AdminProtectedRoute>
            <AdminPage />
          </AdminProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
