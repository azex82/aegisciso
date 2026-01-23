/**
 * SABIC Theme Design Tokens
 * AI Cybersecurity Director Platform
 */

export const sabicTheme = {
  colors: {
    primary: {
      50: '#e6f0ff',
      100: '#b3d1ff',
      200: '#80b3ff',
      300: '#4d94ff',
      400: '#1a75ff',
      500: '#003366',  // SABIC Primary Blue
      600: '#002b57',
      700: '#002347',
      800: '#001a38',
      900: '#001229',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0284c7',  // Accent Blue
      600: '#0369a1',
      700: '#075985',
      800: '#0c4a6e',
      900: '#083344',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    success: {
      light: '#dcfce7',
      main: '#22c55e',
      dark: '#15803d',
    },
    warning: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#b45309',
    },
    error: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#b91c1c',
    },
    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#1d4ed8',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
  },

  spacing: {
    section: '2rem',
    card: '1.5rem',
    element: '1rem',
    tight: '0.5rem',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 51, 102, 0.05)',
    md: '0 4px 6px rgba(0, 51, 102, 0.07)',
    lg: '0 10px 15px rgba(0, 51, 102, 0.1)',
    xl: '0 20px 25px rgba(0, 51, 102, 0.15)',
  },
} as const;

// Risk level configuration
export const riskLevels = {
  CRITICAL: { color: '#dc2626', bgColor: '#fee2e2', label: 'Critical', minScore: 20 },
  HIGH: { color: '#ea580c', bgColor: '#ffedd5', label: 'High', minScore: 12 },
  MEDIUM: { color: '#d97706', bgColor: '#fef3c7', label: 'Medium', minScore: 6 },
  LOW: { color: '#16a34a', bgColor: '#dcfce7', label: 'Low', minScore: 0 },
} as const;

// Maturity level configuration
export const maturityLevels = {
  1: {
    label: 'Initial',
    description: 'Ad-hoc processes, reactive approach',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
  2: {
    label: 'Developing',
    description: 'Basic documentation, some consistency',
    color: '#ea580c',
    bgColor: '#ffedd5',
  },
  3: {
    label: 'Defined',
    description: 'Standardized processes, proactive approach',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  4: {
    label: 'Managed',
    description: 'Measured and controlled processes',
    color: '#65a30d',
    bgColor: '#ecfccb',
  },
  5: {
    label: 'Optimizing',
    description: 'Continuous improvement, industry-leading',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
} as const;

// Score thresholds
export const scoreThresholds = {
  excellent: { min: 90, color: '#16a34a', label: 'Excellent' },
  good: { min: 75, color: '#65a30d', label: 'Good' },
  fair: { min: 50, color: '#d97706', label: 'Fair' },
  poor: { min: 25, color: '#ea580c', label: 'Poor' },
  critical: { min: 0, color: '#dc2626', label: 'Critical' },
} as const;

// Get score configuration based on value
export function getScoreConfig(score: number) {
  if (score >= scoreThresholds.excellent.min) return scoreThresholds.excellent;
  if (score >= scoreThresholds.good.min) return scoreThresholds.good;
  if (score >= scoreThresholds.fair.min) return scoreThresholds.fair;
  if (score >= scoreThresholds.poor.min) return scoreThresholds.poor;
  return scoreThresholds.critical;
}

// Get risk level configuration based on score
export function getRiskLevel(score: number) {
  if (score >= riskLevels.CRITICAL.minScore) return riskLevels.CRITICAL;
  if (score >= riskLevels.HIGH.minScore) return riskLevels.HIGH;
  if (score >= riskLevels.MEDIUM.minScore) return riskLevels.MEDIUM;
  return riskLevels.LOW;
}

// Get maturity level configuration
export function getMaturityLevel(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level)) as 1 | 2 | 3 | 4 | 5;
  return maturityLevels[clampedLevel];
}

// Chart color palette
export const chartColors = [
  '#003366', // SABIC Blue
  '#0284c7', // Accent Blue
  '#0ea5e9', // Light Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#a855f7', // Violet
  '#d946ef', // Fuchsia
] as const;

// Framework colors
export const frameworkColors: Record<string, string> = {
  'NCA_ECC': '#003366',
  'NIST_CSF': '#0284c7',
  'ISO_27001': '#0ea5e9',
  'SOC2': '#6366f1',
  'CIS_CSC': '#8b5cf6',
  'PDPL': '#a855f7',
};

export type ThemeColor = keyof typeof sabicTheme.colors;
export type RiskLevelKey = keyof typeof riskLevels;
export type MaturityLevelKey = keyof typeof maturityLevels;
