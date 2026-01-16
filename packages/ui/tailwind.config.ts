import type { Config } from 'tailwindcss';

const config: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // CSS Variable Based Colors (for theming)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // SHARP Brand Colors - Navy Blue
        navy: {
          50: '#f0f4f8',
          100: '#dce5ef',
          200: '#b8cade',
          300: '#8aa8c7',
          400: '#5a82ad',
          500: '#3d6591',
          600: '#2f4f75',
          700: '#1e3a5f',   // Main Navy
          800: '#162c49',
          900: '#0f1e32',
          950: '#080f1a',
        },

        // SHARP Brand Colors - SABIC Blue
        'sabic-blue': {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#0047af',   // Official SABIC Blue
          800: '#003a8f',
          900: '#002d70',
        },

        // SHARP Brand Colors - SABIC Gold/Yellow
        gold: {
          50: '#fffbeb',
          100: '#fff3c4',
          200: '#ffe588',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#ff9700',   // Official SABIC Yellow
          600: '#e68600',
          700: '#cc7700',
          800: '#a66000',
          900: '#804a00',
        },

        // Grey Scale
        grey: {
          50: '#f9fafb',
          100: '#f4f5f7',
          200: '#e5e7eb',
          300: '#d2d5da',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0c10',
        },

        // Status Colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },

        // Risk Colors
        risk: {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#ff9700',
          low: '#10b981',
          info: '#0066ff',
        },

        // Maturity Colors
        maturity: {
          1: '#dc2626',
          2: '#ea580c',
          3: '#ff9700',
          4: '#22c55e',
          5: '#10b981',
        },

        // Chart Colors
        chart: {
          navy: '#1e3a5f',
          blue: '#0066ff',
          gold: '#ff9700',
          grey: '#6b7280',
          cyan: '#06b6d4',
          teal: '#14b8a6',
          purple: '#8b5cf6',
          pink: '#ec4899',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sharp-sm': '0 1px 2px 0 rgba(30, 58, 95, 0.05)',
        'sharp-md': '0 4px 6px -1px rgba(30, 58, 95, 0.08), 0 2px 4px -2px rgba(30, 58, 95, 0.06)',
        'sharp-lg': '0 10px 15px -3px rgba(30, 58, 95, 0.1), 0 4px 6px -4px rgba(30, 58, 95, 0.08)',
        'sharp-xl': '0 20px 25px -5px rgba(30, 58, 95, 0.12), 0 8px 10px -6px rgba(30, 58, 95, 0.1)',
        'gold-glow': '0 0 20px rgba(255, 151, 0, 0.3)',
        'blue-glow': '0 0 20px rgba(0, 102, 255, 0.3)',
      },
      backgroundImage: {
        'gradient-sharp': 'linear-gradient(135deg, #1e3a5f 0%, #0047af 50%, #0066ff 100%)',
        'gradient-gold': 'linear-gradient(135deg, #ff9700 0%, #ffca28 100%)',
        'gradient-navy-gold': 'linear-gradient(135deg, #1e3a5f 0%, #0047af 50%, #ff9700 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 151, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 151, 0, 0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'pulse-gold': 'pulse-gold 2s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
