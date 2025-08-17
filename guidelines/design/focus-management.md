# Focus Management System

The Espejo focus management system provides a sophisticated approach to focus states that balances visual aesthetics with accessibility. It categorizes focus behaviors based on element types and interaction patterns, ensuring both mouse and keyboard users have appropriate visual feedback.

## Focus Categories

The system defines two primary focus categories:

### 1. Transitional Focus

Elements that users navigate through transiently as part of a journey:

- **Definition**: Keyboard-only focus states for navigational elements
- **Visibility**: Only visible during keyboard navigation (`:focus-visible`)
- **Elements**: Navigation links, topic cards, buttons in flows
- **Implementation**: Two visual styles depending on element type:
  - **Text-based elements**: Color inversion (bg-primary/text-surface)
  - **Button elements**: Ring-based focus (ring-2 ring-accent)

### 2. Retained Focus

Elements that users actively work with for longer periods:

- **Definition**: Focus states that all users should see regardless of input method
- **Visibility**: Visible for all users (`:focus`)
- **Elements**: Text inputs, textareas, select fields
- **Implementation**: Ring-based focus with offset (ring-2 ring-offset-2 ring-accent)

## Focus Utility Classes

The system provides utility classes for focus states:

```css
/* For text-based transitional elements (navigation links, topic titles) */
.focus-transitional-invert {
  @apply focus-visible:outline-none focus-visible:bg-primary focus-visible:text-surface p-1;
}

/* For button-based transitional elements (Button component, VoiceInput) */
.focus-transitional-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent;
}

/* For retained elements (text inputs only - all users see focus) */
.focus-retained {
  @apply focus:outline-none focus:ring-2 focus:ring-accent;
}
```

## Element-Specific Focus Implementations

### Navigation Links

Navigation links use the inversion pattern:

```jsx
<a 
  href="/path" 
  className="px-3 py-1 focus-transitional-invert"
>
  Link Text
</a>
```

### Buttons

Buttons use the ring pattern:

```jsx
<button 
  className="bg-accent text-surface px-4 py-2 rounded focus-transitional-ring"
>
  Button Text
</button>
```

### Text Inputs

Text inputs use the retained focus pattern, typically with parent-based focus-within:

```jsx
<div className="focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2">
  <input 
    className="w-full bg-transparent focus:outline-none" 
    type="text" 
  />
</div>
```

## Focus Conflicts and Solutions

The system resolves common focus conflicts:

### Navigation with Border Accents

- **Problem**: Focus ring conflicts with accent border for active navigation
- **Solution**: Use inversion pattern for navigation focus to complement rather than conflict

### Progress/Step Indicators

- **Problem**: Focus rings around current step create confusion about "current" vs "focused"
- **Solution**: Use distinctive focus style that doesn't overlap with active state indication

### Content Cards with Text Accents

- **Problem**: Focus ring breaks text accent pattern
- **Solution**: Apply focus style that maintains or enhances the text accent pattern

## Programmatic Focus Management

The system includes programmatic focus management for key interactions:

### Auto-Focus Patterns

- **Recording Start**: Focus moves to stop button when recording starts
- **Navigation**: Focus first interactive element after page/step changes
- **Error Recovery**: Focus retry button when errors occur

Example implementation:

```jsx
// Focus management with useRef and useEffect
const buttonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (shouldFocus && buttonRef.current) {
    buttonRef.current.focus();
  }
}, [shouldFocus]);
```

## Focus for Specific Components

### VoiceInput Component

- **Recording Controls**: Use `focus-transitional-ring` for all buttons
- **Programmatic Focus**: Move to stop button on recording start

### TextInput Component

- **Container Focus**: Use focus-within pattern on container
- **Input Focus**: Remove default browser outline

### Navigation Components

- **Desktop Navigation**: Use `focus-transitional-invert` for text links
- **Mobile Navigation**: Use `focus-transitional-ring` for icon buttons

### Topic Selection

- **Topic Cards**: Use `focus-transitional-invert` for card titles

## Accessibility Considerations

- **No Outline Removal**: Never use `outline: none` without a replacement focus indicator
- **Sufficient Contrast**: Focus indicators have at least 3:1 contrast with surroundings
- **Input Method Awareness**: Use `:focus-visible` for keyboard-only focus states
- **Visible Area**: Ensure focus indicators extend at least 2px beyond the element

## Implementation Notes

- Focus utilities are defined in `frontend/src/index.css`
- All interactive elements must have appropriate focus styles
- Use of `:focus-visible` is paired with `:focus` fallbacks for older browsers
- Focus rings use `ring-2` (2px) for sufficient visibility

## Best Practices

1. **Appropriate Category**: Use the correct focus category for the element type
2. **Programmatic Movement**: Implement focus movement for complex interactions
3. **Avoid Conflicts**: Ensure focus styles complement rather than conflict with active states
4. **Consistency**: Use the defined focus utilities rather than custom styles
5. **Testing**: Test focus handling with keyboard navigation across all components
