# Espejo Design System Implementation Guide

**Status**: Phase 1 (Foundation) Complete | Phase 2 (Core Application) Next

This document provides quick reference patterns for implementing the Espejo design system consistently across all components.

## 🎯 Core Patterns (Use These Everywhere)

### Color Token Usage
```jsx
// ✅ CORRECT - Use these tokens consistently
className="bg-background text-primary"           // Body text
className="bg-surface text-primary"              // Cards/containers  
className="bg-accent hover:bg-accent-hover text-surface"  // Primary buttons
className="text-secondary"                       // Subtle text
className="border-border-subtle"                 // Borders
className="bg-neutral-bg"                        // Light backgrounds
```

### Typography Scale (Based on Original Design System)
```jsx
// ✅ CORRECT - Interface Elements (14px - refined, not screaming)
className="text-body-sm font-medium"             // Navigation, buttons, labels, helper text
className="text-body-sm"                         // Footer links, form labels, metadata

// ✅ CORRECT - Content Elements  
className="text-display font-bold"               // Main page titles (40px)
className="text-headline font-medium"            // Section headings, question text (24px)  
className="text-body-lg"                         // Main body text, textarea content (18px)
className="text-body"                            // Standard body text, descriptions (16px)
className="text-caption"                         // Smallest text, captions (12px)

// 🎯 KEY PRINCIPLE: Interface vs Content
// Interface = text-body-sm (14px) - compact, refined
// Content = text-body-lg (18px) - readable, spacious
```

### Layout Containers
```jsx
// ✅ CORRECT - Use fixed max-widths per design system
className="max-w-5xl mx-auto"                    // App shell (header, nav, footer)
className="max-w-3xl mx-auto"                    // Main content areas

// ❌ WRONG - Don't use these anymore
className="container mx-auto"                    // Removed from config
className="max-w-4xl"                            // Wrong width
```

### Focus States
```jsx
// ✅ CORRECT - Consistent focus pattern
className="focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
```

### Font Usage
```jsx
// ✅ CORRECT - Limited serif usage
className="font-serif italic text-2xl"          // Logo only
className="font-serif font-medium text-headline" // Q/A letters only
// Default: Inter sans-serif for everything else
```

## 🔄 Token Migration Quick Reference

When updating existing components, replace these tokens:

### Shadcn → Espejo Mappings
```jsx
// Text colors
"text-foreground"        → "text-primary"
"text-muted-foreground"  → "text-secondary" 
"text-primary"           → "text-primary"    // Keep as-is

// Backgrounds  
"bg-background"          → "bg-background"   // Keep as-is
"bg-card"                → "bg-surface"
"bg-muted"               → "bg-neutral-bg"
"bg-primary"             → "bg-accent"

// Borders & Focus
"border-input"           → "border-subtle"
"border"                 → "border-subtle" 
"ring-ring"              → "ring-accent"

// Error states (use accent color)
"bg-destructive"         → "bg-accent"
"text-destructive"       → "text-accent"
```

### Hard-coded Color Replacements
```jsx
// Replace all hard-coded colors with tokens
"text-gray-900"          → "text-primary"
"text-gray-600"          → "text-secondary"
"bg-white"               → "bg-surface"
"bg-gray-50"             → "bg-background"
"bg-red-50"              → "bg-accent"        // Error backgrounds
"text-red-600"           → "text-accent"      // Error text
```

## 🚫 Anti-Patterns to Avoid

### Don't Use Double Prefixes
```jsx
// ❌ WRONG - Double prefixes
"text-text-primary"
"bg-bg-surface" 
"border-border-subtle"

// ✅ CORRECT - Single prefixes
"text-primary"
"bg-surface"
"border-subtle"
```

### Don't Mix Up Interface vs Content Typography
```jsx
// ❌ WRONG - Using content sizes for interface
"text-base"              // Navigation (too big, screaming)
"text-lg"                // Buttons (too big, screaming)

// ✅ CORRECT - Use interface sizes for interface
"text-body-sm"           // Navigation, buttons, labels (14px, refined)
"text-body-lg"           // Main content, textarea (18px, readable)
```

### Don't Use Removed Tokens
```jsx
// ❌ WRONG - These tokens don't exist anymore
"bg-card", "text-muted-foreground", "bg-destructive", "ring-ring", "border-input"
```

### Don't Use Old Container Patterns
```jsx
// ❌ WRONG - Removed from design system
"container mx-auto"      // Config removed
"max-w-4xl"             // Wrong width
```

## 🏹 The "Apple Strike" Formula (Pedantic Design Process)

Based on auth form refinement - apply systematically to achieve first-strike precision:

### 1. Pattern Recognition Phase
```jsx
// Identify the exact same issues across components:
- Typography: text-lg → text-headline
- Surface: Missing bg-surface + generous padding  
- Spacing: space-y-4 → space-y-8
- Width: Full width → max-w-lg → max-w-sm progression
- Color Logic: Disabled accent → Secondary when unavailable
```

### 2. Systematic Application Order
**Never skip steps - each builds on the previous:**

1. **Typography Hierarchy** → Design system scale first
2. **Surface Treatment** → Interactive framing with `bg-surface rounded-lg p-16`
3. **Spacing Rhythm** → Generous `space-y-8` breathing room
4. **Width Constraints** → Proper container relationships
5. **Semantic Color Logic** → Logical accent usage

### 3. The Perfect Form Pattern
```jsx
// Outer container: Content width + generous spacing
<div className="w-full max-w-3xl mx-auto space-y-12 p-6">
  <WelcomeContent />
  
  {/* Interactive form: Surface treatment + constrained width */}
  <div className="w-full max-w-lg mx-auto bg-surface rounded-lg p-16">
    <form className="space-y-8 max-w-sm mx-auto">
      <Input />
      <Button 
        variant={!ready ? 'secondary' : 'default'}
        disabled={!ready}
      />
    </form>
  </div>
  
  <SupportingContent />
</div>
```

### 4. Width Relationship Hierarchy
```jsx
// Perfect proportional relationships:
max-w-3xl (768px)    // Content area
  max-w-lg (512px)   // Interactive container  
    max-w-sm (384px) // Form elements
```

### 5. Surface Usage Rules
- **Communication content** → Background (no surface)
- **Interactive elements** → Surface framing (`bg-surface`)
- **Supporting text** → Background (back to neutral)

### 6. Semantic Color Logic
```jsx
// NEVER use accent for disabled states
variant={!actionable ? 'secondary' : 'default'}
// Accent color must be EARNED by being functionally available
```

### 7. Typography Precision
```jsx
// Content hierarchy (generous, readable):
text-display     // Main headlines (40px)
text-headline    // Section headings (24px) 
text-body-lg     // Primary content (18px)
text-body        // Standard content (16px)

// Interface elements (refined, not screaming):
text-body-sm     // UI elements, buttons, labels (14px)
```

## 🎯 Pedantic Checklist for Every Component

### Before Starting
- [ ] Read existing component code completely
- [ ] Identify current typography classes
- [ ] Check current spacing patterns  
- [ ] Note width constraints used
- [ ] Examine color/variant logic

### During Implementation  
- [ ] Apply typography scale systematically
- [ ] Add surface treatment if interactive
- [ ] Implement generous spacing rhythm
- [ ] Set proper width relationships
- [ ] Fix semantic color logic
- [ ] Test responsive behavior

### Quality Standards
- [ ] Every text element uses design system scale
- [ ] Interactive elements have surface framing
- [ ] Spacing feels luxurious, not cramped
- [ ] Widths create proper visual balance
- [ ] Colors make semantic sense
- [ ] Matches auth form polish level

## 🎨 Component Styling Strategy

### Remove Card-Heavy Designs
- **Current**: Complex cards with borders, shadows, backgrounds
- **Target**: Minimal, flat design with abundant white space
- **Action**: Remove unnecessary `border`, `shadow`, `bg-card` styling

### Error State Strategy  
- **Principle**: Errors use accent color to dominate visual hierarchy
- **Implementation**: All error states use `bg-accent`, `text-accent`, `border-accent`
- **Rationale**: Single accent usage prevents visual competition

### Button Variants (Reference)
```jsx
// Use these exact patterns for consistency
default:     "bg-accent hover:bg-accent-hover text-surface"
destructive: "bg-accent hover:bg-accent-hover text-surface"  
outline:     "border border-border-subtle bg-surface hover:bg-accent hover:text-surface"
secondary:   "bg-neutral-bg hover:bg-border-subtle text-primary"
ghost:       "hover:bg-accent hover:text-surface"
link:        "text-accent underline-offset-4 hover:underline"
```

## ⚡ Quick Migration Checklist

For each component file:

1. **Color audit**: Search for `text-gray-`, `bg-red-`, `border-blue-` etc. → Replace with design tokens
2. **Typography**: Replace `text-3xl`, `text-lg` → Use `text-display`, `text-headline`, etc.
3. **Containers**: Replace `max-w-4xl`, `container mx-auto` → Use `max-w-5xl`/`max-w-3xl`
4. **Focus states**: Standardize to ring-accent pattern
5. **Remove cards**: Simplify visual hierarchy, remove unnecessary borders/backgrounds
6. **Error states**: Consolidate to accent color usage

## 🔍 Verification Commands

```bash
# Check for remaining issues
grep -r "hsl(var" frontend/src/                    # Should return nothing
grep -r "text-gray-\|bg-red-\|border-blue" frontend/src/  # Find hard-coded colors  
grep -r "max-w-4xl\|container mx-auto" frontend/src/      # Find old container patterns
grep -r "text-destructive\|bg-destructive" frontend/src/  # Find old error tokens
```

## 📋 Implementation Priority

**Groups 3-4 (Phase 2)**: Layout + high-impact components
**Groups 5-6 (Phase 3)**: Mobile + comprehensive cleanup

Each component needs **visual direction analysis**: remove cards, simplify hierarchy, apply minimalism principles consistently.