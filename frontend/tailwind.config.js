/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFA',
        foreground: '#09090B',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#09090B',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#09090B',
        },
        muted: {
          DEFAULT: '#F4F4F5',
          subtle: '#FAFAFA',
          foreground: '#686872',
        },
        accent: {
          DEFAULT: '#F4F4F5',
          foreground: '#18181B',
        },
        border: '#E4E4E7',
        primary: {
          DEFAULT: '#155DFC',
          hover: '#1447E6',
          foreground: '#FFFFFF',
          soft: '#EFF6FF',
          'soft-foreground': '#1447E6',
        },
        secondary: {
          DEFAULT: '#F4F4F5',
          foreground: '#18181B',
        },
        success: {
          DEFAULT: '#00813A',
          foreground: '#FFFFFF',
          soft: '#F0FDF4',
          'soft-foreground': '#016630',
          'soft-border': '#B9F8CF',
        },
        warning: {
          DEFAULT: '#B55200',
          foreground: '#FFFFFF',
          soft: '#FFFBEB',
          'soft-foreground': '#953D00',
          'soft-border': '#FEE685',
        },
        destructive: {
          DEFAULT: '#E40016',
          foreground: '#FFFFFF',
          soft: '#FEF2F2',
          'soft-foreground': '#9F0A0A',
          'soft-border': '#FECACA',
        },
        sidebar: {
          DEFAULT: '#FAFAFA',
          foreground: '#09090B',
          accent: '#F4F4F5',
          'accent-foreground': '#18181B',
          border: '#E4E4E7',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        dialog: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
