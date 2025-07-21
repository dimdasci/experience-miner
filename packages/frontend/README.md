# Experience Miner Frontend

React + TypeScript frontend for the Experience Miner interview application.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **Tailwind CSS** + **Shadcn/ui** for styling
- **React Router** for navigation
- **Lucide React** for icons

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── interview/          # Interview flow components
│   │   ├── InterviewView.tsx
│   │   ├── Recorder.tsx
│   │   └── FactsView.tsx
│   └── ui/                # Shadcn/ui components (to be added)
├── hooks/
│   └── useAudioRecorder.ts # Audio recording functionality
├── services/
│   └── apiService.ts      # Backend API integration
├── constants.ts           # Interview questions and config
├── types.ts              # Shared TypeScript types
├── App.tsx               # Main app component
└── main.tsx             # Application entry point
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

## API Integration

The frontend expects the backend API to be running on port 8080. The Vite dev server is configured to proxy `/api` requests to the backend.

## Deployment

Built for Railway deployment with:
- `nixpacks.toml` - Build configuration
- `Caddyfile` - Static file serving with security headers