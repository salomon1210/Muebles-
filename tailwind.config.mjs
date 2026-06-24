/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}'],
  theme: {
    extend: {
      colors: {
        // Paleta premium sobria (Armani Casa / Harrods).
        noir: {
          DEFAULT: '#16130f', // negro cálido
          900: '#0d0b08',
          800: '#16130f',
          700: '#211d17',
        },
        crema: {
          DEFAULT: '#f6f1e7', // crema / hueso
          50: '#fbf8f2',
          100: '#f6f1e7',
          200: '#ece3d3',
        },
        beige: {
          DEFAULT: '#c9b896', // beige cálido
          dark: '#a8946f',
        },
        oro: {
          DEFAULT: '#b08d4f', // dorado tenue
          light: '#c9a766',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      maxWidth: {
        prose2: '68ch',
      },
    },
  },
  plugins: [],
};
