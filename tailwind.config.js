/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Raw palette tokens (fixed hues, do not flip)
        power: '#7F7767',
        sun: '#F9F095',
        pool: '#D6E6E4',
        neutral: '#F4F3EB',
        strength: '#000000',

        // Semantic tokens — driven by CSS variables so they flip in dark mode.
        // `<alpha-value>` lets utilities like bg-surface/80 keep working.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        // Input/toggle default + hover borders (dark mode raises these to a
        // clearly-visible hairline; light stays as-is).
        field: 'rgb(var(--field) / <alpha-value>)',
        'field-hover': 'rgb(var(--field-hover) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        highlight: 'rgb(var(--highlight) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      fontFamily: {
        // One typeface — hierarchy now comes from WEIGHT, not family. Both keys
        // kept so existing font-display / font-sans usage keeps resolving.
        display: ['"Plus Jakarta Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Cap the scale at 600: display headings + currently-bold stats use
      // `font-bold`, which now renders 600 (semibold). Nothing goes above 600.
      fontWeight: {
        bold: '600',
      },
    },
  },
  plugins: [],
}
