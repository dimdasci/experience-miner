# Backend Architecture and implementation


## Configuration

```
src/config/
├── server.ts         # Express server, CORS, logging (5 env vars)
├── database.ts       # PostgreSQL connection & pool (5 env vars)
├── ai.ts            # AI providers, models, rate limits (2 env vars)
├── auth.ts          # Supabase authentication (2 env vars)
├── monitoring.ts    # Sentry, observability (3 env vars)
└── credits.ts       # Business logic - credit rates (4 env vars)
```

Sensitive and environment-specific variables are set in environment variables, while operational settings are defined in the configuration files. Each file imports its own environment variables and validates them using Zod schemas.


## Connections to services

```
src/common/connections/
├── databaseConnection.ts     # PostgreSQL pool (renamed from database.ts)
├── geminiConnection.ts       # Google AI with rate limiting & retry logic  
├── supabaseConnection.ts     # Supabase client with health monitoring
└── index.ts                  # Centralized connection exports
```

