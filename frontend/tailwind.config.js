/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme'); // Importamos los temas por defecto

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // --- NUEVA CONFIGURACIÓN DE FUENTE ---
      // Hacemos que 'Inter' sea la fuente por defecto para todo el texto sans-serif.
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      // --- FIN DE LA CONFIGURACIÓN DE FUENTE ---
      colors: {
          'dark-bg-body': '#1a1b25',
          'dark-bg-card': '#2a2b38',
      }
    },
  },
  plugins: [],
}
