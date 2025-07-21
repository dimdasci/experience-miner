# Experience Miner

A guided AI interview system that helps job seekers extract and organize their career experiences into structured data for resume building and interview preparation.

## Overview

Experience Miner addresses the core challenge job seekers face: **losing track of career experiences and achievements over time**. Through guided AI interviews powered by Google's Gemini 2.5 Flash, it extracts structured career data including companies, roles, projects, achievements, and skills from conversational interviews.

### Key Features

- **Guided AI Interviews**: Topic-based conversation structure covering key career areas
- **Hybrid Input**: Type answers or use voice recorder with automatic transcription
- **Editable Transcripts**: Fix names, terminology, and details before processing
- **AI-Powered Extraction**: Converts interview transcripts into structured career artifacts
- **Cloud Storage**: Supabase-based knowledge base with sessions and facts organization

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Shadcn/Tailwind
- **Backend**: Express + TypeScript + Biome
- **AI Processing**: Google Gemini 2.5 Flash
- **Database & Auth**: Supabase (PostgreSQL + Authentication)
- **Deployment**: Railway (monorepo)
- **Package Manager**: PNPM

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PNPM >= 9.0.0
- Google Gemini API key
- Supabase account (for production deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/experience-miner.git
   cd experience-miner
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   # Backend environment
   cp packages/backend/.env.example packages/backend/.env
   # Add your Gemini API key and Supabase credentials
   
   # Frontend environment  
   cp packages/frontend/.env.example packages/frontend/.env
   # Add your Supabase public keys
   ```

4. **Development servers**
   ```bash
   # Start both frontend and backend
   pnpm dev
   
   # Or start individually
   pnpm backend:dev
   pnpm frontend:dev
   ```

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Run code quality checks
- `pnpm clean` - Clean all build artifacts

## Project Structure

```
experience-miner/
├── packages/
│   ├── backend/          # Express TypeScript API
│   │   ├── src/
│   │   │   ├── api/      # API routes
│   │   │   ├── services/ # Gemini & Supabase services
│   │   │   └── common/   # Shared utilities
│   │   └── package.json
│   └── frontend/         # React application
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── hooks/       # React hooks
│       │   ├── services/    # API services
│       │   └── context/     # Auth context
│       └── package.json
├── tasks/                # Project planning docs
├── references/           # Implementation references
├── package.json          # Workspace configuration
└── pnpm-workspace.yaml   # PNPM workspace definition
```

## API Endpoints

- `POST /api/transcribe` - Convert audio to text via Gemini
- `POST /api/extract` - Extract structured career data from transcripts
- `GET /health` - Health check for deployment monitoring

## Environment Variables

### Backend
- `API_KEY` - Google Gemini API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `PORT` - Server port (default: 8080)

### Frontend
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous public key

## License

This project is licensed under the [Business Source License 1.1](LICENSE). Personal use for job searching activities is permitted. Commercial use (career coaching, recruiting, competitive products) is prohibited. The license converts to MIT after 4 years.

## Contributing

This is an MVP focused on speed to market. See `tasks/implementation-plan.md` for detailed technical specifications and development roadmap.

## Support

For technical guidance, see [CLAUDE.md](CLAUDE.md) for Claude Code integration details.