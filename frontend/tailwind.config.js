/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'serif': ['Lora', 'serif'],
      },
      colors: {
        // Espejo design system colors (remove hsl() wrappers, keep var() references)
        'background': 'var(--background)',
        'surface': 'var(--surface)', 
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'primary': 'var(--text-primary)',        // Keep existing usage pattern
        'secondary': 'var(--text-secondary)',    // Keep existing usage pattern  
        'neutral-bg': 'var(--neutral-bg)',
        // Special mappings for specific use cases
        'foreground': 'var(--text-primary)', // For bg-foreground → bg-foreground usage (caret)
      },
      borderColor: {
        DEFAULT: 'var(--border-subtle)',
        'subtle': 'var(--border-subtle)',
      },
      fontSize: {
        'display': ['2.5rem', '3rem'],     // 40px / 48px line-height
        'headline': ['1.5rem', '2rem'],    // 24px / 32px line-height  
        'body-lg': ['1.125rem', '1.75rem'], // 18px / 28px line-height
        'body': ['1rem', '1.5rem'],        // 16px / 24px line-height
        'body-sm': ['0.875rem', '1.25rem'], // 14px / 20px line-height
        'caption': ['0.75rem', '1rem'],    // 12px / 16px line-height
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}