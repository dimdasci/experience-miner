# Typography

The Espejo typography system combines a clean sans-serif font for UI elements with a sophisticated serif font for key branding and decorative elements. This dual-font approach creates a balanced design that is both professional and approachable.

## Base Font Size

**Important:** The Espejo design system uses a **14px base font size** rather than the default 16px that Tailwind typically uses. This means that `1rem = 14px` throughout the application. All rem values in the documentation and code should be calculated with this 14px base in mind.

## Font Families

The typography system uses two complementary font families:

### Inter (Sans-Serif)
- **Primary UI font** for all interface elements
- Clean, modern, and highly legible at all sizes
- Used for navigation, buttons, body text, and most UI elements
- Configured in Tailwind as `font-sans`
- Rich OpenType feature set for refined typography

### Lora (Serif)
- **Decorative accent font** for specific decorative elements only
- Sophisticated, warm, and distinctive character
- Used exclusively for single letters or very short combinations as decorative elements
- Typically displayed oversized and outside the main text flow
- Configured in Tailwind as `font-serif`
- **Never used for regular text content**

## Type Scale

The Espejo design system uses a defined type scale to maintain consistent text sizing:

| Token       | Size / Line Height | Usage                                    |
|-------------|--------------------|-----------------------------------------|
| `display`   | 35px / 44px        | Hero headers, large section titles       |
| `headline`  | 21px / 28px        | Section headings, card titles            |
| `body-lg`   | 15.75px / 28px     | Primary content, emphasized text         |
| `body`      | 14px / 24px        | Standard body text, most UI text         |
| `body-sm`   | 12.25px / 20px     | Secondary information, labels            |
| `caption`   | 10.5px / 16px      | Metadata, footnotes, input hints         |

## Implementation

The type scale is implemented in Tailwind configuration:

### Desktop Type Scale

```js
// frontend/tailwind.config.js
fontSize: {
  // Desktop sizes
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
}
```

## Usage Patterns

### Headings and Titles
- Use `text-display` for page titles and main headers
- Use `text-headline` for section headers and card titles
- Always maintain heading hierarchy (h1 → h2 → h3)

Example:
```jsx
<h1 className="text-display font-medium text-primary">
  Experience Miner
</h1>
<h2 className="text-headline font-medium text-primary mt-8">
  Interview Guide
</h2>
```

### Body Text
- Use `text-body` for standard content
- Use `text-body-lg` for emphasized content sections
- Use `text-body-sm` for secondary information
- Maintain consistent line height for readability

Example:
```jsx
<p className="text-body text-primary mb-4">
  Standard paragraph text uses the body size.
</p>
<p className="text-body-lg text-primary mb-4">
  Important content can use the larger body size.
</p>
<p className="text-body-sm text-secondary">
  Secondary information uses the smaller size and secondary color.
</p>
```

### UI Elements
- Use `text-body` for most UI elements
- Use `text-body-sm` for form labels and secondary UI text
- Use `text-caption` for hints, tooltips, and metadata

### Decorative Elements
- Use `font-serif` for decorative elements and branding
- The "A" icon in the answer section uses `font-serif font-medium text-headline`

## Font Weight Usage

The Espejo typography system uses a limited set of font weights for clear hierarchy:

| Weight     | Tailwind Class    | Usage Pattern                            |
|------------|--------------------|------------------------------------------|
| Regular (400) | `font-normal`   | Default body text and UI elements        |
| Medium (500)  | `font-medium`   | Headings, button text, emphasized text   |
| Bold (700)    | `font-bold`     | Used sparingly for extreme emphasis      |

## Serif Accent Usage

The serif font (Lora) must be used very sparingly and only in specific contexts:

- **Wordmark only**: The "Espejo" wordmark in the logo
- **Decorative single letters**: The "A" icon in the answer section (`font-serif font-medium text-headline`)
- **Oversized decorative elements**: Only as individual letters or very short combinations (1-2 characters)
- **Always outside text flow**: Never integrated within regular text content

Strict restrictions on Lora usage:
- **Never for body text** of any kind
- **Never for multiple words** or sentences
- **Never for regular UI elements** like navigation, buttons, or form elements
- **Never for headings** except the wordmark
- **Never inline** with regular text

## Mobile Typography

On mobile devices, typography is adjusted for optimal reading on smaller screens:

### Mobile Font Size & Line Height Scale

The mobile typography scale makes these key adjustments:

1. **Reduced headings**: Display and headline text sizes are smaller on mobile
2. **Consistent body sizes**: Body text sizes remain the same across devices
3. **Tighter line heights**: Line heights are reduced by 4-8px on mobile for all text variants

| Token       | Desktop Size / LH | Mobile Size / LH | Size Change | LH Change |
|-------------|-------------------|------------------|-------------|-----------|
| `display`   | 35px / 44px       | 26px / 32px      | -9px        | -12px     |
| `headline`  | 21px / 28px       | 18px / 24px      | -3px        | -4px      |
| `body-lg`   | 15.75px / 28px    | 15.75px / 20px   | None        | -8px      |
| `body`      | 14px / 24px       | 14px / 20px      | None        | -4px      |
| `body-sm`   | 12.25px / 20px    | 12.25px / 16px   | None        | -4px      |
| `caption`   | 10.5px / 16px     | 10.5px / 16px    | None        | None      |

### Implementation

Mobile typography is implemented using responsive utility classes:

```jsx
// For size and line height changes (headings)
<h1 className="text-display md:text-mobile-display font-medium">
  Page Title
</h1>

// For line height changes only (body text)
<p className="text-body md:text-mobile-body-lh">
  This paragraph will have the same size but tighter line height on mobile.
</p>
```

### Mobile Typography Principles

1. **Selective size reduction**: Only heading sizes are reduced on mobile
2. **Consistent body text**: Body text maintains the same size for readability
3. **Tighter line heights**: All text has more compact line spacing on mobile
4. **Preserved vertical rhythm**: All mobile line heights align to the 4px grid

## Best Practices

1. **Maintain hierarchy**: Use appropriate size tokens for hierarchy
2. **Consistent color**: Pair typography with semantic color tokens
3. **Respect spacing**: Use consistent margins and line height
4. **Limited weights**: Use only the defined font weights
5. **Serif sparingly**: Reserve serif font for specific decorative elements

## OpenType Features

Inter provides a rich set of OpenType features that should be leveraged to enhance text display:

### Numeric Formatting
- **Tabular Numbers**: Use `tabular-nums` for numbers that need alignment in columns or timers
  ```jsx
  <span className="tabular-nums">00:42</span> // As seen in VoiceInput timer
  ```
- **Proportional Numbers**: Default setting for most text contexts
- **Lining Figures**: Default style for numbers
- **Oldstyle Figures**: Available through `oldstyle-nums` for specific decorative contexts

### Letter Spacing
- **Tracking**: Adjust with utility classes like `tracking-wider` for specific elements that benefit from increased legibility
- **Tight Tracking**: Use `tracking-tight` for large display text
- **Default Tracking**: Most body text should use default spacing

### Ligatures
- **Standard Ligatures**: Enabled by default
- **Discretionary Ligatures**: Available for decorative text through `discretionary-ligatures`

### Contextual Alternates
- Enabled by default to improve text appearance

### Examples in Code
From VoiceInput.tsx:
```jsx
<span className="tabular-nums text-lg tracking-wider">
  {formatTime(recordingDuration)}
</span>
```
This timer display uses:
- `tabular-nums` for digit alignment
- `tracking-wider` for improved readability
- `text-lg` for appropriate visual prominence

## Implementation Notes

- Font files are loaded in `frontend/index.html`
- **Base font size (14px)** is set in `:root` in `frontend/src/index.css` (`font-size: 14px;`)
- Type scale is configured in `frontend/tailwind.config.js`
- Components should use the typography tokens rather than arbitrary sizes
- All pixel calculations should be based on 14px = 1rem (not the default 16px)
