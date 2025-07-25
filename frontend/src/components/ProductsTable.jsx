import React from 'react';

const ProductsTable = ({ products, handleProductChange, addProduct, removeProduct }) => {
  // Estilos base para los inputs de la tabla
  const tableInputStyles = "w-full p-2 border border-transparent bg-gray-100 dark:bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm text-gray-800 dark:text-gray-200";

  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">2. Productos</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate" style={{ borderSpacing: "0 0.5rem" }}>
          <thead>
            <tr>
              <th className="w-5/12 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
              <th className="w-2/12 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unidades</th>
              <th className="w-2/12 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">P. Unitario</th>
              <th className="w-2/12 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
              <th className="w-1/12 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td className="px-1"><input type="text" name="descripcion" value={product.descripcion} onChange={(e) => handleProductChange(index, e)} className={tableInputStyles} /></td>
                <td className="px-1"><input type="number" name="unidades" value={product.unidades} onChange={(e) => handleProductChange(index, e)} className={tableInputStyles} /></td>
                <td className="px-1"><input type="number" step="0.01" name="precio_unitario" value={product.precio_unitario} onChange={(e) => handleProductChange(index, e)} className={tableInputStyles} /></td>
                <td className="px-1"><input type="text" name="total" value={product.total.toFixed(2)} readOnly className={`${tableInputStyles} bg-gray-200 dark:bg-gray-800`} /></td>
                <td className="px-1 text-center">
                    <button type="button" onClick={() => removeProduct(index)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold transition text-sm">
                        Eliminar
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={addProduct} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
        + Agregar Producto
      </button>
    </div>
  );
};

export default ProductsTable;
