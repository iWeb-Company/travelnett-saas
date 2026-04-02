/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      animation: {
        'infinite-scroll': 'infinite-scroll 25s linear infinite',
      },
      keyframes: {
        'infinite-scroll': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        }
      }                    
    },
  },
  plugins: [],
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
};
