# Spacing & Layout

The Espejo design system uses a consistent spacing approach to create balanced, harmonious layouts across all interfaces. This guide outlines the spacing system, container patterns, and layout structures used throughout the application.

## Spacing Scale

The spacing system uses Tailwind's default spacing scale with multiples of 4px, with specific patterns for different contexts:

### Element Spacing

| Token     | Size | Usage                                          |
|-----------|------|------------------------------------------------|
| `space-x-2` | 8px  | Minimal spacing (icon + text, tight groups)    |
| `space-x-4` | 16px | Standard horizontal spacing between elements   |
| `space-x-6` | 24px | Generous spacing between related elements      |
| `space-y-4` | 16px | Standard vertical spacing between elements     |
| `space-y-6` | 24px | Generous vertical spacing between elements     |
| `space-y-10` | 40px | Section spacing                               |

### Padding & Margins

| Token    | Size | Usage                                      |
|----------|------|----------------------------------------------|
| `p-1`    | 4px  | Built into focus-transitional-invert utility |
| `p-2`    | 8px  | Tight padding (small interactive elements)   |
| `p-3`    | 12px | Medium padding (buttons, icons)              |
| `p-4`    | 16px | Standard padding (cards, containers)         |
| `p-6`    | 24px | Generous padding (main content areas)        |
| `px-4 py-2` | 16px horizontal, 8px vertical | Button padding  |
| `mt-2`   | 8px  | Minimal top margin                           |
| `mt-4`   | 16px | Standard top margin                          |
| `mt-6`   | 24px | Medium top margin                            |
| `mt-10`  | 40px | Large section top margin                     |
| `mb-4`   | 16px | Standard bottom margin                       |
| `mb-6`   | 24px | Medium bottom margin                         |

## Container System

The Espejo design system uses a set of container patterns for consistent layout:

### Page Container

The main page content is contained within a centered, max-width container:

- **Maximum width**: `max-w-3xl` (768px)
- **Horizontal margin**: `mx-auto`
- **Padding**: `px-4` for consistent horizontal spacing

```jsx
<div className="max-w-3xl mx-auto px-4">
  {/* Page content */}
</div>
```

### Section Containers

Sections within a page use consistent vertical spacing:

- **Vertical margin**: `my-10` (40px) between major sections
- **Vertical padding**: `py-6` (24px) for section content

```jsx
<section className="my-10">
  <h2 className="text-headline font-medium mb-6">Section Title</h2>
  <div className="py-6">
    {/* Section content */}
  </div>
</section>
```

### Content Cards

The Espejo design system intentionally limits the use of card elements:

- **Primary approach**: Avoid cards in most UI contexts to maintain visual simplicity
- **Limited usage**: Only introduce cards when a screen has minimal components and needs visual hierarchy
- **Strict constraints**: 
  - Never use nested cards (cards within cards)
  - Never use multiple cards on the same screen
  - Only use cards for essential interactive components

When used, cards follow this pattern:
- **Background**: `bg-surface`
- **Border radius**: `rounded-lg` (8px)
- **Padding**: Varies based on context (`p-6` standard, `p-16` for entry points)
- **Shadow**: None (flat design aesthetic)

```jsx
<div className="bg-surface rounded-lg p-6">
  {/* Card content */}
</div>
```

These constraints support the minimalist design philosophy of Espejo by:
- Reducing visual noise and complexity
- Creating clear focus on essential interactive elements
- Maintaining a clean, flat aesthetic throughout the application
- Preventing the overuse of nested containers that can lead to visual clutter

## Layout Patterns

### Icon + Content Layout

A common pattern for pairing icons with content:

```jsx
<div className="flex items-start space-x-6">
  <div className="flex-shrink-0 w-8">
    {/* Icon */}
  </div>
  <div className="flex-grow">
    {/* Content */}
  </div>
</div>
```

### Vertical Stack Layout

The Espejo design system uses a specific vertical stack approach that ensures predictable layout with controlled scrolling:

- **Single scrollable region** per screen
- **Fixed header and footer** with scrollable content area in between
- **Proper flex configuration** to ensure scrolling works correctly

```jsx
{/* App structure */}
<div className="flex flex-col h-screen">
  {/* Fixed header */}
  <div className="flex-shrink-0">
    <SectionHeader title="Example" />
  </div>
  
  {/* Scrollable content area */}
  <div className="flex flex-col flex-grow min-h-0 overflow-y-auto">
    {/* Content that may overflow */}
    <div className="space-y-4">
      {/* Stacked items */}
    </div>
  </div>
  
  {/* Fixed footer/controls */}
  <div className="flex-shrink-0">
    {/* Navigation controls */}
  </div>
</div>
```

Key implementation details:
- `flex-shrink-0` ensures headers and footers maintain their size
- `flex-grow` allows the content area to fill available space
- `min-h-0` is critical to enable scrolling within flex containers
- `overflow-y-auto` applied only to the main content area

This approach maintains a clean UI with essential navigation always accessible while allowing content to scroll as needed.

### Button Groups

For groups of related buttons:

```jsx
<div className="flex items-center space-x-4">
  {/* Buttons */}
</div>
```

## Spacing in Specific Components

### Form Elements

- **Input height**: `h-10` (40px)
- **Input padding**: `px-4 py-2`
- **Gap between label and input**: `mt-2`
- **Gap between form fields**: `mt-4`

### Navigation Elements

- **Nav item padding**: `px-4 py-2`
- **Gap between nav items**: `space-x-6`
- **Nav section padding**: `py-4`

### Button Elements

- **Default padding**: `px-4 py-2`
- **Small button padding**: `px-3 py-1.5`
- **Large button padding**: `px-6 py-3`
- **Gap between buttons**: `space-x-4`

## Empty States & Loading States

- **Vertical padding**: `py-12` (48px)
- **Horizontal alignment**: `justify-center`
- **Vertical alignment**: `items-center`

```jsx
<div className="flex items-center justify-center py-12">
  <div className="text-secondary">Loading...</div>
</div>
```

## Mobile-Specific Spacing

On mobile devices, spacing is adjusted to optimize the user experience on smaller screens:

### Mobile Spacing Scale

| Desktop Token | Mobile Token | Desktop Size | Mobile Size | Reduction |
|---------------|--------------|--------------|-------------|-----------|
| `space-x-6`   | `space-x-3`  | 24px        | 12px        | -12px     |
| `space-y-10`  | `space-y-6`  | 40px        | 24px        | -16px     |
| `p-6`         | `p-4`        | 24px        | 16px        | -8px      |
| `mt-10`       | `mt-6`       | 40px        | 24px        | -16px     |
| `px-4 py-2`   | `px-3 py-2`  | 16px/8px    | 12px/8px    | -4px/0px  |

### Mobile Layout Principles

1. **Reduced margins**: Horizontal margins are typically reduced by 25-50%
2. **Tighter vertical spacing**: Section spacing is reduced proportionally
3. **Touch targets**: All interactive elements maintain minimum 44px height
4. **Compact components**: Component padding is reduced while maintaining usability
5. **Preserved hierarchy**: The ratio of spacing between related and unrelated elements is maintained

## Implementation Notes

- All spacing values are implemented using Tailwind's utility classes
- Consistent spacing patterns should be maintained across all components
- Maintain proper vertical rhythm using the defined spacing scale
- Use appropriate padding inside elements for proper touch targets (min 44px)

## Best Practices

1. **Consistent spacing**: Use the defined spacing scale rather than arbitrary values
2. **Proper grouping**: Use consistent spacing for related elements
3. **Generous whitespace**: Provide sufficient breathing room between sections
4. **Responsive adjustments**: Adjust spacing on mobile (see Responsive Design)
5. **Containment**: Use the container system for proper content width
6. **Vertical rhythm**: Maintain consistent vertical spacing throughout pages
