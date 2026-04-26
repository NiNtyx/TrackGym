/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'ios-blue': '#007AFF',
        'ios-green': '#30D158',
        'ios-orange': '#FF9F0A',
        'ios-red': '#FF3B30',
      },
    },
  },
  plugins: [],
};
