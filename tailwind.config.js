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
      },
      animation: {
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'icon-pop': 'icon-pop 3s ease-in-out infinite',
        'sparkle-drift-1': 'sparkle-drift-1 3.2s ease-out infinite',
        'sparkle-drift-2': 'sparkle-drift-2 3.8s ease-out infinite 1.2s',
        'shimmer-sweep': 'shimmer-sweep 0.6s ease-in-out',
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
