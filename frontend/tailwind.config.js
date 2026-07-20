/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        riobamba: {
          blue: '#0B2545',       // Azul institucional primario
          blueLight: '#134074',  // Azul secundario para interacciones
          blueAccent: '#8DA9C4', // Azul claro
          red: '#D90429',        // Rojo oficial de Riobamba
          redHover: '#A30015',
          yellow: '#F5B800',     // Amarillo de advertencia
          green: '#10B981',      // Verde de éxito
          purple: '#8B5CF6',     // Violeta de cierre
          darkBg: '#0b132b',     // Fondo oscuro premium
          darkCard: '#1c2541'    // Tarjetas oscuras
        }
      }
    },
  },
  plugins: [],
}
