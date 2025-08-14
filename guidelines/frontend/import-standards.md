# Import Standards

This guide outlines the import standards for the Experience Miner frontend. Consistent import patterns make codebases more maintainable and reduce common issues related to circular dependencies and unclear module boundaries.

## Import Order

Organize imports in the following order, with a blank line between each group:

1. External libraries and frameworks
2. Absolute imports from shared modules
3. Relative imports from the current feature
4. Type imports
5. CSS/SCSS imports

Example:

```tsx
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';

// 2. Absolute imports from shared modules
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { logger } from '@shared/utils/logger';

// 3. Relative imports from current feature
import { useTopicForm } from '../hooks/useTopicForm';
import TopicList from '../components/TopicList';
import { topicService } from '../services/topicService';

// 4. Type imports
import type { Topic, TopicFormData } from '../topic.types';

// 5. CSS/SCSS imports
import './TopicPage.css';
```

## Import Syntax

### Default Exports vs Named Exports

For components, prefer default exports:

```tsx
// Component file (Button.tsx)
const Button = ({ children, ...props }) => {
  // ...
};

export default Button;

// Importing
import Button from '@shared/ui/button';
```

For utilities, hooks, and other non-component files, prefer named exports:

```tsx
// Utility file (stringUtils.ts)
export const capitalize = (str: string) => {
  // ...
};

export const truncate = (str: string, length: number) => {
  // ...
};

// Importing
import { capitalize, truncate } from '@shared/utils/stringUtils';
```

### Multiple Imports from Same Source

Group imports from the same source:

```tsx
// Good
import { useState, useEffect, useMemo } from 'react';

// Avoid
import { useState } from 'react';
import { useEffect } from 'react';
import { useMemo } from 'react';
```

### Destructuring Imports

Prefer destructuring when importing multiple items:

```tsx
// Good
import { Button, Card, Modal } from '@shared/ui';

// Avoid if importing multiple items
import Button from '@shared/ui/button';
import Card from '@shared/ui/card';
import Modal from '@shared/ui/modal';
```

### Type Imports

Use explicit type imports to make it clear what's a type and what's a value:

```tsx
import type { User, AuthState } from '@features/auth/auth.types';
```

## Path Aliases

Use the configured path aliases to avoid deep relative paths:

```tsx
// Good
import { Button } from '@shared/ui/button';
import { useAuth } from '@features/auth/hooks/useAuth';

// Avoid
import { Button } from '../../../../shared/ui/button';
import { useAuth } from '../../auth/hooks/useAuth';
```

Our configured path aliases are:

- `@/*` - For root src directory access
- `@shared/*` - For shared components, utilities, and other cross-cutting code
- `@features/*` - For feature-specific code
- `@lib/*` - For third-party library configurations (supabase, utils)
- `@services/*` - For API and other services (when moved to shared)
- `@types/*` - For global type definitions (when organized separately)

## Import Best Practices

### Avoid Circular Dependencies

Circular dependencies occur when two modules import each other, directly or indirectly. To avoid this:

- Keep import structure hierarchical
- Use interfaces or types to break dependency cycles
- Consider restructuring code if circular dependencies arise

### Avoid Index Files for Feature Modules

Don't use barrel exports (index.ts files) for feature modules as they can lead to unnecessary imports and circular dependencies:

```tsx
// Avoid this pattern for features
// features/auth/index.ts
export * from './components/AuthForm';
export * from './hooks/useAuth';
export * from './contexts/AuthContext';
// etc.
```

Instead, import directly from the source:

```tsx
import { AuthForm } from '@features/auth/components/AuthForm';
import { useAuth } from '@features/auth/hooks/useAuth';
```

### Use Barrel Exports for UI Components

For shared UI components, barrel exports can be useful:

```tsx
// shared/ui/index.ts
export { Button } from './button';
export { Card } from './card';
export { Input } from './input';
// etc.

// Usage
import { Button, Card, Input } from '@shared/ui';
```

### Lazy Loading

Use dynamic imports for code splitting:

```tsx
// In a route configuration file
import { lazy } from 'react';

const ProfilePage = lazy(() => import('@features/profile/ProfilePage'));
const SettingsPage = lazy(() => import('@features/settings/SettingsPage'));

// In router configuration
{
  path: '/profile',
  element: (
    <Suspense fallback={<Loading />}>
      <ProfilePage />
    </Suspense>
  )
}
```

### Re-exporting

Avoid re-exporting components or hooks from other features:

```tsx
// Avoid this
// features/profile/hooks/index.ts
export { useAuth } from '@features/auth/hooks/useAuth';
```

Instead, import directly from the source:

```tsx
import { useAuth } from '@features/auth/hooks/useAuth';
```

### Internal Feature Structure

Within a feature, you can use relative imports:

```tsx
// Within the same feature
import { useTopicForm } from '../hooks/useTopicForm';
import TopicListItem from './TopicListItem';
```

### Importing Types

For prop type imports from the same file, use:

```tsx
import type { ButtonProps } from './Button.types';
// or if types are in the same file
import Button, { ButtonProps } from './Button';
```

## Path Resolution Configuration

Our path resolution is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@features/*": ["./src/features/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

And in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@features': path.resolve(__dirname, './src/features'),
      '@lib': path.resolve(__dirname, './src/lib')
    }
  }
});
```

## Conclusion

Following these import standards ensures code consistency, prevents common issues, and makes the codebase more maintainable. When in doubt, look at existing code for examples or consult with the team.
