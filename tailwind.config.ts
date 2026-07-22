import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1020',
        indigo: '#111936',
        cream: '#f5f0e6',
        gold: '#d8b875',
        mist: '#aeb8d6',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif TC', 'serif'],
      },
      boxShadow: {
        glow: '0 24px 80px rgba(62, 74, 158, 0.22)',
      },
    },
  },
  plugins: [],
} satisfies Config;
