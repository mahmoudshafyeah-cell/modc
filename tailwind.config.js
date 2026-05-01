/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
        display: ['Tajawal', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        violet: {
          50: '#F5F0FF',
          100: '#EDE0FF',
          200: '#D4BBFF',
          300: '#B899FF',
          400: '#9B6BFF',
          500: '#6C3AFF',
          600: '#5A2EDD',
          700: '#4420BB',
          800: '#2E1599',
          900: '#1A0A77',
        },
        cyan: {
          400: '#00E5FF',
          500: '#00D4FF',
          600: '#00AACC',
        },
        dark: {
          50: '#1A1A35',
          100: '#111128',
          200: '#0D0D22',
          300: '#0A0A14',
          400: '#070710',
        },
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at 50% 0%, rgba(108,58,255,0.3) 0%, rgba(0,212,255,0.1) 40%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(108,58,255,0.1), rgba(0,212,255,0.05))',
        'violet-gradient': 'linear-gradient(135deg, #6C3AFF, #9B6BFF)',
        'cyan-gradient': 'linear-gradient(135deg, #00D4FF, #0099BB)',
        'gold-gradient': 'linear-gradient(135deg, #FFB800, #FF6B00)',
      },
      boxShadow: {
        'neon-violet': '0 0 20px rgba(108,58,255,0.5), 0 0 40px rgba(108,58,255,0.2)',
        'neon-cyan': '0 0 20px rgba(0,212,255,0.5), 0 0 40px rgba(0,212,255,0.2)',
        'card': '0 8px 32px rgba(0,0,0,0.4)',
        'card-hover': '0 16px 48px rgba(108,58,255,0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(108,58,255,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(108,58,255,0.8)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};