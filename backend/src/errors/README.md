# Centralized Error Handling

This directory contains the centralized error handling implementation for the Experience Miner backend.

## Overview

The error handling system uses functional programming patterns with `fp-ts` to provide:
- **Type-safe error handling** with structured error codes
- **Centralized error processing** in middleware
- **Consistent error responses** across all endpoints
- **Integrated Sentry logging** with proper context

## Architecture

### 1. AppError Classes (`AppError.ts`)

**Base AppError Class**:
```typescript
abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: AppErrorCode;
  public readonly details?: unknown;
  public readonly isOperational = true;
}
```

**Specific Error Types**:
- `NotFoundError` (404) - Resource not found
- `UnauthorizedError` (401) - Authentication failures  
- `ForbiddenError` (403) - Authorization failures
- `BadRequestError` (400) - Validation and business logic errors
- `PaymentRequiredError` (402) - Credit system errors
- `ConflictError` (409) - Concurrent operation conflicts
- `RateLimitError` (429) - Rate limiting
- `ServiceUnavailableError` (503) - External service failures
- `InternalError` (500) - Internal server errors

### 2. Error Middleware (`middleware/errorHandler.ts`)

Centralized error processing:
- **AppError handling**: Uses structured error codes and status codes
- **Legacy error mapping**: Converts old string-based errors to structured format
- **Sentry integration**: Single capture point with rich context
- **Request correlation**: Tracks errors across request lifecycle
- **Structured logging**: Consistent error logging format

### 3. Async Wrapper (`utils/asyncWrap.ts`)

Eliminates try/catch blocks in route handlers:
```typescript
router.get('/endpoint', authenticateToken, wrapAsync(async (req, res) => {
  // Business logic - errors automatically caught and forwarded
  throw AppErrors.notFound('Resource not found');
}));
```

## Usage Patterns

### 1. Controller Error Handling

**Before (Imperative)**:
```typescript
try {
  const result = await service.doSomething();
  res.json(ServiceResponse.success("Success", result));
} catch (error) {
  let statusCode = 500;
  if (error.message === "Not found") {
    statusCode = 404;
  }
  res.status(statusCode).json(ServiceResponse.failure(error.message));
}
```

**After (Functional)**:
```typescript
// Just throw - middleware handles everything
const result = await service.doSomething();
res.json(ServiceResponse.success("Success", result));
```

### 2. Service Layer with Either/TaskEither

```typescript
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';

validateAndProcess(userId: string): TE.TaskEither<DomainError, Result> {
  return pipe(
    this.validateUser(userId),
    TE.chain(user => this.processUser(user)),
    TE.chain(result => this.saveResult(result))
  );
}
```


## Error Response Format

All errors follow this standardized format:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "responseObject": null,
  "statusCode": 400,
  "errorCode": "VALIDATION_FAILED"
}
```

## Application Error Codes

Frontend can handle errors consistently using error codes:

- **Resource Access**: `TOPIC_NOT_FOUND`, `INTERVIEW_NOT_FOUND`, `INTERVIEW_ACCESS_DENIED`
- **Credits**: `INSUFFICIENT_CREDITS`, `INVALID_CREDIT_AMOUNT`
- **Rate Limiting**: `RATE_LIMIT_EXCEEDED`, `AI_SERVICE_UNAVAILABLE`
- **Validation**: `VALIDATION_FAILED`, `NO_ANSWERED_QUESTIONS`
- **Operations**: `OPERATION_IN_PROGRESS`, `UNAUTHORIZED`, `FORBIDDEN`

