import React, { useState, useEffect, useRef } from 'react';

// --- NUEVO COMPONENTE: CustomDropdown ---
// Este componente reemplaza el <select> nativo por uno personalizado.
const CustomDropdown = ({ label, options, selectedOption, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Cierra el menú si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelectOption = (option) => {
        onSelect(option);
        setIsOpen(false);
    };

    const labelStyles = "block text-sm font-semibold text-gray-600 dark:text-gray-400";
    const baseButtonStyles = "mt-1 w-full flex items-center justify-between py-2 px-3 text-left bg-gray-100 dark:bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm text-gray-800 dark:text-gray-200";

    return (
        <div className="relative" ref={dropdownRef}>
            <label className={labelStyles}>{label}</label>
            <button
                type="button"
                className={baseButtonStyles}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption}</span>
                <svg className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            
            {/* Lista de opciones con animación */}
            <div className={`absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg transition-all duration-200 ease-out ${isOpen ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95 pointer-events-none'}`}>
                <ul className="py-1">
                    {options.map((option) => (
                        <li
                            key={option}
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleSelectOption(option)}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const ClientForm = ({ clientData, handleClientChange, handleConsultar, loadingConsulta }) => {
  const inputStyles = "mt-1 block w-full py-2 px-3 border border-transparent bg-gray-100 dark:bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm text-gray-800 dark:text-gray-200";
  const labelStyles = "block text-sm font-semibold text-gray-600 dark:text-gray-400";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">1. Datos del Cliente</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Usamos el nuevo componente CustomDropdown */}
        <CustomDropdown
            label="Tipo de Documento"
            options={['DNI', 'RUC']}
            selectedOption={clientData.tipo_documento}
            onSelect={(option) => handleClientChange({ target: { name: 'tipo_documento', value: option } })}
        />
        
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

      {/* Usamos el nuevo componente CustomDropdown también para la moneda */}
      <CustomDropdown
          label="Moneda"
          options={['SOLES', 'DOLARES']}
          selectedOption={clientData.moneda}
          onSelect={(option) => handleClientChange({ target: { name: 'moneda', value: option } })}
      />
    </div>
  );
};

export default ClientForm;
