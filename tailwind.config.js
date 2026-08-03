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
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'gradient-rotate': 'gradient-rotate 4s linear infinite',
        'icon-pop': 'icon-pop 2s ease-in-out infinite',
        'sparkle-drift-1': 'sparkle-drift-1 2.5s ease-out infinite',
        'sparkle-drift-2': 'sparkle-drift-2 3s ease-out infinite 0.8s',
        'sparkle-drift-3': 'sparkle-drift-3 2.8s ease-out infinite 1.5s',
        'shimmer-sweep': 'shimmer-sweep 2.5s ease-in-out infinite',
        'attention-bounce': 'attention-bounce 5s ease-in-out infinite',
        'border-glow-rotate': 'border-glow-rotate 3s ease-in-out infinite',
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
