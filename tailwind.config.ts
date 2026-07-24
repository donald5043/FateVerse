import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070b16',
        indigo: '#10152b',
        cream: '#f4ecdb',
        gold: '#d8b875',
        mist: '#9aa6c9',
        vermilion: '#c8452f',
        celeste: '#7c9fe0',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif TC', 'serif'],
        display: ['Cormorant Garamond', 'Noto Serif TC', 'serif'],
      },
      boxShadow: {
        glow: '0 24px 80px rgba(62, 74, 158, 0.22)',
      },
    },
  },
  plugins: [],
} satisfies Config;
