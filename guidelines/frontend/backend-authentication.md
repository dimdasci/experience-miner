# Backend Authentication Implementation

## Prerequisites

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.52.0",
    "express": "^4.21.2"
  }
}
```

## Setup

1. Create auth service client:
```typescript
// src/providers/auth/authService.ts
import { createClient, SupabaseClient, User, AuthError } from '@supabase/supabase-js';

export class AuthService {
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  async validateToken(token: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.client.auth.getUser(token);
    return { user: data.user, error };
  }
}

// Singleton instance
export const authService = new AuthService(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

2. Create authentication middleware:
```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../providers/auth/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const { user, error } = await authService.validateToken(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication service error' });
  }
}
```

## Usage

### Protected Route
```typescript
// src/api/routes/protectedRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/protected', authenticateToken, (req, res) => {
  // req.user is populated by middleware
  res.json({ userId: req.user.id });
});

export default router;
```

### Access User in Handler
```typescript
import { AuthenticatedRequest } from '../middleware/auth';

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  const userId = req.user.id;        // User ID from JWT
  const email = req.user.email;       // User email

  // Use userId to fetch user-specific data
}
```

### Multiple Protected Routes
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply to all routes
router.use(authenticateToken);

router.get('/profile', getProfile);
router.get('/settings', getSettings);
router.post('/data', createData);

export default router;
```

## Auth Flow

1. Client sends request with `Authorization: Bearer <token>` header
2. Middleware extracts token from header
3. Token validated via `authService.validateToken()` → calls Supabase `auth.getUser()`
4. On success → User object attached to `req.user`
5. On failure → Returns 401 with error message
6. Handler accesses authenticated user via `req.user`

## Error Responses

- `401 Access token required` - No Authorization header
- `401 Invalid or expired token` - Token validation failed
- `500 Authentication service error` - Auth service exception
