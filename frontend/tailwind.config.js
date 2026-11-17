/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          bg: '#F8FAFC',       // Clean modern slate-50 canvas
          card: '#FFFFFF',     // Crisp white cards
          subtle: '#F1F5F9',   // Soft slate-100 headers / recessed areas
          border: '#E2E8F0',   // Slate-200 crisp border
          strong: '#0F172A',   // Slate-900 sharp structural line
        },
        ink: {
          primary: '#0F172A',  // Slate-900 deep charcoal
          secondary: '#475569', // Slate-600
          muted: '#94A3B8',    // Slate-400
        },
        brand: {
          DEFAULT: '#0D9488',  // Modern Vibrant Emerald Teal (600)
          hover: '#0F766E',    // Teal-700
          subtle: '#F0FDFA',   // Teal-50
          border: '#CCFBF1',   // Teal-100
        },
        risk: {
          highBg: '#FEF2F2',
          highText: '#B91C1C',
          highBorder: '#FCA5A5',
          medBg: '#FFFBEB',
          medText: '#B45309',
          medBorder: '#FCD34D',
          lowBg: '#F0FDF4',
          lowText: '#15803D',
          lowBorder: '#86EFAC',
        },
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        card: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        glow: '0 0 20px -3px rgba(13, 148, 136, 0.25)',
      },
    },
  },
  plugins: [],
};
