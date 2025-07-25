import React from 'react';

const ClientForm = ({ clientData, handleClientChange, handleConsultar, loadingConsulta }) => {
  // Estilos base para los inputs para no repetirlos
  const inputStyles = "mt-1 block w-full py-2 px-3 border border-transparent bg-gray-100 dark:bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm text-gray-800 dark:text-gray-200";
  const labelStyles = "block text-sm font-semibold text-gray-600 dark:text-gray-400";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">1. Datos del Cliente</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="tipo_documento" className={labelStyles}>Tipo de Documento</label>
          <select id="tipo_documento" name="tipo_documento" value={clientData.tipo_documento} onChange={handleClientChange} className={inputStyles}>
            <option>DNI</option>
            <option>RUC</option>
          </select>
        </div>
        <div>
          <label htmlFor="nro_documento" className={labelStyles}>Número de Documento</label>
          <div className="flex space-x-2">
            <input type="text" id="nro_documento" name="nro_documento" value={clientData.nro_documento} onChange={handleClientChange} className={inputStyles} />
            <button type="button" onClick={handleConsultar} disabled={loadingConsulta} className="whitespace-nowrap bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-blue-400">
              {loadingConsulta ? '...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="nombre_cliente" className={labelStyles}>Nombre del Cliente</label>
        <input type="text" id="nombre_cliente" name="nombre_cliente" value={clientData.nombre_cliente} onChange={handleClientChange} required className={inputStyles} />
      </div>
      <div>
        <label htmlFor="direccion_cliente" className={labelStyles}>Dirección</label>
        <input type="text" id="direccion_cliente" name="direccion_cliente" value={clientData.direccion_cliente} onChange={handleClientChange} required className={inputStyles} />
      </div>
      <div>
        <label htmlFor="moneda" className={labelStyles}>Moneda</label>
        <select id="moneda" name="moneda" value={clientData.moneda} onChange={handleClientChange} className={inputStyles}>
          <option>SOLES</option>
          <option>DOLARES</option>
        </select>
      </div>
    </div>
  );
};

export default ClientForm;