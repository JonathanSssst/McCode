/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'vsc-bg': '#1e1e1e',
        'vsc-bg-alt': '#252526',
        'vsc-bg-dark': '#181818',
        'vsc-border': '#2b2b2b',
        'vsc-fg': '#cccccc',
        'vsc-fg-dim': '#858585',
        'vsc-accent': '#0078d4',
        'vsc-activity': '#333333',
      },
      fontFamily: {
        mono: ['Consolas', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
