# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Express + TypeScript API (ESM). Source in `backend/src`, tests in `backend/src/**/*.{test,spec}.ts`, build to `backend/dist`.
- `frontend/`: React + Vite + Tailwind. Source in `frontend/src`, built assets in `frontend/dist`.
- `tasks/` and `references/`: design notes, plans, and research. Useful context for changes.
- Common logs in `*/logs/`; example configs in `*.env.example`.

## Build, Test, and Development Commands
- Backend
  - `cd backend && npm run dev`: start API with hot-reload.
  - `cd backend && npm run build`: type-check and bundle to `dist/`.
  - `cd backend && npm test`: run Vitest suite. `npm run test:cov` for coverage.
  - `cd backend && npm run check-all`: lint, type-check, then tests.
  - `cd backend && npm start`: run compiled server from `dist/index.js`.
- Frontend
  - `cd frontend && npm run dev`: Vite dev server (logs to `logs/frontend.log`).
  - `cd frontend && npm run build`: Type-check then production build.
  - `cd frontend && npm run preview`: preview built app locally.

## Coding Style & Naming Conventions
- Tooling: Biome for linting/formatting (`npm run lint`, `npm run format`).
- Language: TypeScript (ES2020 target in backend). Indentation: 2 spaces.
- Naming: React components PascalCase (`App.tsx`), hooks `useX`. Backend files camelCase/kebab-case; tests use `*.test.ts`.
- Keep modules small and colocate tests next to code under `src/`.

## Testing Guidelines
- Framework: Vitest (backend). Coverage thresholds: 80% lines/branches/functions/statements.
- Test files: `src/**/*.{test,spec}.ts`.
- Commands: `npm test` (unit), `npm run test:watch` (TDD), `npm run test:cov` (coverage report in `coverage/`).
- Frontend: no formal tests yet; add Vitest + React Testing Library for new components when feasible.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`). Write clear, scoped messages.
- PRs: include description, linked issue(s), steps to test, and screenshots for UI changes. Ensure `backend` passes `npm run check-all` and `frontend` builds.
- Keep PRs focused; prefer smaller, reviewable changes.

## Security & Configuration Tips
- Create `.env` files from `.env.example` in both `backend/` and `frontend/`. Do not commit secrets.
- Sentry and Supabase keys are required for full functionality; use development keys locally.
- Node.js 20+ recommended; backend enforces `>=20.19.0`.
