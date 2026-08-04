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
        // "The Darkroom" palette — warm black, brick-red safelight, teal trust
        background: '#0D0C0A',
        surface: '#161512',
        'surface-border': '#2A2722',
        primary: '#D4452A',          // brick-red safelight — bold, distinctive
        'primary-dark': '#B8381F',   // deeper brick for hover states
        secondary: '#3D8B7D',        // teal — Integrity Engine / trust elements
        text: '#EBE5D9',             // warm white (safelight on photo paper)
        'text-muted': '#9B9488',     // warm grey
        page: '#0D0C0A',
        card: '#161512',
        line: '#2A2722',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
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
