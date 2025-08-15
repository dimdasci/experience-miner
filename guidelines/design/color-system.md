# Color System

The Espejo color system uses a sophisticated Graphite & Terracotta palette that creates a warm, supportive, and empowering atmosphere for job seekers. The system is built on semantic color tokens that maintain consistent meaning across both light and dark themes.

## Design Tokens

Color tokens are defined as CSS custom properties in `frontend/src/index.css` and mapped to Tailwind classes in `frontend/tailwind.config.js`.

### Light Mode

| Token                | Value     | Tailwind    | Usage                               |
|----------------------|-----------|-------------|-------------------------------------|
| `--background`       | `#f9fafb` | `gray-50`   | Main page background                |
| `--surface`          | `#ffffff` | `white`     | Cards, headers, input areas         |
| `--accent`           | `#c2410c` | `orange-700`| Primary buttons, active states      |
| `--accent-hover`     | `#9a3412` | `orange-800`| Hover state for primary buttons     |
| `--text-primary`     | `#111827` | `gray-900`  | Headings, primary content           |
| `--text-secondary`   | `#6b7280` | `gray-500`  | Sub-headings, labels, secondary info|
| `--border-subtle`    | `#e5e7eb` | `gray-200`  | Subtle borders and dividers         |
| `--neutral-bg`       | `#e5e7eb` | `gray-200`  | Neutral button backgrounds          |

### Dark Mode

| Token                | Value     | Tailwind    | Usage                               |
|----------------------|-----------|-------------|-------------------------------------|
| `--background`       | `#111827` | `gray-900`  | Main page background                |
| `--surface`          | `#1f2937` | `gray-800`  | Cards, headers, input areas         |
| `--accent`           | `#f97316` | `orange-500`| Primary buttons, active states      |
| `--accent-hover`     | `#ea580c` | `orange-600`| Hover state for primary buttons     |
| `--text-primary`     | `#ffffff` | `white`     | Headings, primary content           |
| `--text-secondary`   | `#9ca3af` | `gray-400`  | Sub-headings, labels, secondary info|
| `--border-subtle`    | `#374151` | `gray-700`  | Subtle borders and dividers         |
| `--neutral-bg`       | `#374151` | `gray-700`  | Neutral button backgrounds          |

## Using Color Tokens

Always use the semantic color tokens instead of hard-coded Tailwind colors. This ensures theme consistency and simplifies future updates.

```jsx
// ✅ Do
<div className="bg-background text-primary">
  <button className="bg-accent text-surface hover:bg-accent-hover">
    Submit
  </button>
</div>

// ❌ Don't
<div className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
  <button className="bg-orange-700 text-white hover:bg-orange-800">
    Submit
  </button>
</div>
```

## Semantic Color Usage

The Espejo color system defines specific semantic meanings for color tokens:

| Token        | Usage Pattern                                               |
|--------------|-------------------------------------------------------------|
| `background` | Page backgrounds only                                       |
| `surface`    | Content containers, cards, headers                          |
| `accent`     | Primary buttons, active states, focus rings, links          |
| `primary`    | Primary text content (headings, body text)                  |
| `secondary`  | Secondary text content (labels, descriptions, placeholders) |

## Color Accessibility

All color combinations in the Espejo design system meet WCAG 2.1 AA accessibility standards for contrast:

- Text on backgrounds (primary/secondary on background/surface): > 4.5:1
- Interactive elements (accent on surface, text on accent): > 3:1
- Large text (display/headline): > 3:1

## State Management with Color

Color plays a key role in communicating state:

| State     | Implementation                                           |
|-----------|----------------------------------------------------------|
| Default   | Normal color tokens (`text-primary`, `bg-surface`)       |
| Hover     | Slightly modified tokens (`bg-accent-hover`)             |
| Active    | Accent color for selected items (`text-accent`, `border-accent`) |
| Disabled  | Reduced opacity (`opacity-50`)                          |
| Focus     | Focus rings and inverted colors (see Focus System)       |
| Error     | Restricted to error-specific components only            |

## Implementation Notes

- The color system is implemented in `frontend/src/index.css` using CSS custom properties
- Tailwind mappings are configured in `frontend/tailwind.config.js`
- All UI components should use the semantic color tokens rather than direct color values
- Color tokens have consistent meaning across light and dark themes

## Best Practices

1. **Consistent semantics**: Use color tokens according to their semantic meaning
2. **Minimal accent usage**: Reserve accent colors for important interactive elements
3. **Text hierarchy**: Maintain clear distinction between primary and secondary text
4. **Surface elevation**: Use surface color for raised elements on the background
5. **Focus indication**: Use accent color for focus indication (see Focus System)
