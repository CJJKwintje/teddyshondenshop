/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'system-ui', 'sans-serif'],
        heading: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    function({ addBase }) {
      addBase({
        'h1, h2, h3, h4, h5, h6': {
          fontFamily: 'Nunito, system-ui, sans-serif',
          fontWeight: '700',
        },
      });
    },
  ],
};
