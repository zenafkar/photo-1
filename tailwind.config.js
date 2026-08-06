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
        // --- Existing "The Darkroom" palette (Used by StudioDashboard) ---
        background: '#0D0C0A',
        surface: '#161512',
        'surface-border': '#2A2722',
        primary: '#D4452A',
        'primary-dark': '#B8381F',
        secondary: '#3D8B7D',
        text: '#EBE5D9',
        'text-muted': '#9B9488',
        page: '#0D0C0A',
        card: '#161512',
        line: '#2A2722',

        // --- NEW "High-End Studio" palette (Strictly for Landing Page) ---
        'landing-bg': '#08080A',
        'landing-surface': '#121216',
        'landing-border': '#1F1F24',
        'landing-primary': '#D926A9', // Neon Pink
        'landing-primary-dark': '#B81A8D',
        'landing-secondary': '#4F46E5', // Electric Indigo
        'landing-text': '#F4F4F5', // Studio White
        'landing-text-muted': '#8B949E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        'landing-display': ['Outfit', 'sans-serif'],
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
