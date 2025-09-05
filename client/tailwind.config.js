// module.exports = {
//   content: [
//     './index.html',
//     './src/**/*.{js,jsx,ts,tsx}',
//   ],
//   purge: [],
//   darkMode: false, // or 'media' or 'class'
//   theme: {
//     extend: {},
//   },
//   variants: {
//     extend: {},
//   },
//   plugins: [],
// }
// tailwind.config.js
const { nextui } = require('@nextui-org/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  purge: [],
  darkMode: false,
  plugins: [nextui()],
};