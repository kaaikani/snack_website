import colors from 'tailwindcss/colors';
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  plugins: [require('@tailwindcss/forms')],
  important: '#app',

  theme: {
    extend: {
      screens: {
        mob: '425px',
        md: '768px',
      },
      colors: {
        primary: colors.sky,
        secondary: colors.emerald,
      },
      animation: {
        dropIn: 'dropIn 0.2s ease-out',
        marquee: 'marquee 20s linear infinite',
      },
      keyframes: {
        dropIn: {
          '0%': { transform: 'translateY(-100px)' },
          '100%': { transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
} satisfies Config;
