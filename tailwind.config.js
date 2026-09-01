/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Ensure this points to your source code
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    // If you use a `src` directory, add: './src/**/*.{js,tsx,ts,jsx}'
    // Do the same with `components`, `hooks`, `styles`, or any other top-level directories
  ],
  presets: [require("nativewind/preset")],

  theme: {
    extend: {},
  },
  plugins: [],
};
