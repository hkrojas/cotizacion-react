/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <-- AÑADE ESTA LÍNEA
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        // Colores personalizados para el modo oscuro, como en tu app original
        colors: {
            'dark-bg-body': '#1a1b25',
            'dark-bg-card': '#2a2b38',
        }
    },
  },
  plugins: [],
}