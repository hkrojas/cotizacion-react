// frontend/src/utils/apiUtils.js
// Archivo para centralizar funciones útiles relacionadas con la API.

/**
 * Parsea un objeto de error de la API de FastAPI y devuelve un mensaje legible.
 * @param {object} errorData - El objeto de error JSON de la respuesta de la API.
 * @returns {string} Un mensaje de error formateado y legible para el usuario.
 */
export const parseApiError = (errorData) => {
    // Si el error tiene un campo 'detail'
    if (errorData && errorData.detail) {
        // Si 'detail' es un string, lo devolvemos directamente.
        if (typeof errorData.detail === 'string') {
            return errorData.detail;
        }
        // Si 'detail' es un array (común en errores de validación de Pydantic)
        if (Array.isArray(errorData.detail)) {
            // Mapeamos cada error del array a un string legible.
            return errorData.detail.map(err => {
                // err.loc es un array, ej: ['body', 'password']. Tomamos el último elemento.
                const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : 'campo';
                // err.msg es el mensaje de error.
                return `${field}: ${err.msg}`;
            }).join('; '); // Unimos los mensajes con '; '
        }
    }
    // Si el formato del error no es el esperado, devolvemos un mensaje genérico.
    return 'Ocurrió un error desconocido al procesar la respuesta del servidor.';
};
