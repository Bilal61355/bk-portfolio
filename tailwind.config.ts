import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { ink: '#11110f', paper: '#e9e7df', muted: '#77766f', line: '#c9c6bc', acid: '#c5f36a' },
      fontFamily: { sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'], display: ['Georgia', 'serif'] },
    },
  },
  plugins: [],
};

export default config;
