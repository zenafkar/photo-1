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
        background: '#0A0A0A',
        surface: '#121212',
        'surface-border': '#27272A', // zinc-800
        primary: '#4F46E5',
        'primary-dark': '#4338CA',
        secondary: '#0EA5E9',
        text: '#FAFAFA', // zinc-50
        'text-muted': '#A1A1AA', // zinc-400
        page: '#0A0A0A',
        card: '#121212',
        line: '#27272A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
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
