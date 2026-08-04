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
        background: '#FAFAF9',
        surface: '#FFFFFF',
        'surface-border': '#E7E5E4',
        primary: '#4F46E5',
        'primary-dark': '#4338CA',
        secondary: '#0284C7',
        text: '#1C1917',
        'text-muted': '#57534E',
        // Warm accent tokens for the new light theme
        warm: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        ink: '#1C1917',
        muted: '#57534E',
        page: '#FAFAF9',
        card: '#FFFFFF',
        line: '#E7E5E4',
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
      },
      fontSize: {
        '3.5xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
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
