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
      spacing: {
        '13': '3.25rem', // This would be equivalent to the calculation (1.75rem + 1.5rem)
      },
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
        // Desktop sizes (14px base: 1rem = 14px)
        'display': ['2.5rem', '3.143rem'],    // 35px / 44px line-height
        'headline': ['1.5rem', '2rem'],       // 21px / 28px line-height  
        'body-lg': ['1.125rem', '2rem'],      // 15.75px / 28px line-height
        'body': ['1rem', '1.714rem'],         // 14px / 24px line-height
        'body-sm': ['0.875rem', '1.429rem'],  // 12.25px / 20px line-height
        'caption': ['0.75rem', '1.143rem'],   // 10.5px / 16px line-height
        
        // Mobile-specific sizes (only display and headline get smaller)
        'mobile-display': ['1.857rem', '2.286rem'],   // 26px / 32px
        'mobile-headline': ['1.286rem', '1.714rem'],  // 18px / 24px
        
        // Mobile line height variants (same font size, reduced line height)
        'mobile-body-lg-lh': ['1.125rem', '1.429rem'],  // 15.75px / 20px (same size, reduced LH)
        'mobile-body-lh': ['1rem', '1.429rem'],         // 14px / 20px (same size, reduced LH)
        'mobile-body-sm-lh': ['0.875rem', '1.143rem'],  // 12.25px / 16px (same size, reduced LH)
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}