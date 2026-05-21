/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        panel: '#11131c',
        panelLight: '#191d2c',
        borderGlow: '#1f2538',
        neonCyan: '#00f0ff',
        neonGreen: '#00ffaa',
        neonRed: '#ff2a5f',
        textMuted: '#94a3b8'
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'scroll-marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }
    },
  },
  plugins: [],
}
