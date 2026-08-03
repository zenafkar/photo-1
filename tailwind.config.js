/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        background: '#FFFFFF',
        surface: '#FFFFFF',
        'surface-border': '#F1F5F9',
        primary: '#4F46E5', // Indigo
        'primary-dark': '#4338CA',
        secondary: '#0EA5E9', // Sky blue
        text: '#0F172A',
        'text-muted': '#64748B'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-none': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.overscroll-contain': {
          'overscroll-behavior': 'contain',
        },
      });
    },
  ],
}
