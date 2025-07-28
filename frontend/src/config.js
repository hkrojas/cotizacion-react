// frontend/src/config.js
// Archivo para centralizar la configuración de la aplicación.

// Obtenemos la URL de la API desde las variables de entorno de Vite.
// Si no está definida, usamos una URL local por defecto.
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
