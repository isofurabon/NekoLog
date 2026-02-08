# Agent Instructions for NekoLog

This document provides guidance for AI agents working on the NekoLog codebase.

## Project Overview

NekoLog is a browser-based Android Logcat viewer built with React and TypeScript. It uses WebUSB for direct device connectivity and Web Workers for background log parsing.

## Tech Stack

- **Runtime**: Deno 2.0+
- **Framework**: React 19 with TypeScript
- **State**: Jotai for atom-based state management
- **Build**: Vite
- **Styling**: Tailwind CSS 4 with Catppuccin Mocha theme
- **Testing**: Vitest (unit), Playwright (E2E)

## Development Commands

```bash
deno install          # Install dependencies
deno task dev         # Start development server
deno task build       # Build for production
deno task test:unit   # Run unit tests
deno task lint        # Run linter
deno task ci          # Run full CI pipeline (requires Dagger)
```

## Project Structure

```
src/
├── components/       # React components (ControlBar, Viewer)
├── hooks/            # Custom React hooks
├── store/            # Jotai atoms for state
├── utils/            # Utility functions
├── workers/          # Web Workers for log parsing
├── types/            # TypeScript type definitions
└── constants/        # Application constants

e2e/                  # Playwright E2E tests
dagger/               # CI/CD pipeline definitions
```

## Code Style Guidelines

1. **TypeScript**: Use strict types. Avoid `any`.
2. **React**: Use functional components with hooks.
3. **Imports**: Use import maps defined in `deno.json`.
4. **Linting**: Run `deno task lint` before commits.
5. **Naming**: 
   - Components: PascalCase (`LogViewer.tsx`)
   - Hooks: camelCase with `use` prefix (`useLogFilter.ts`)
   - Utils: camelCase (`parseLog.ts`)

## Testing Guidelines

- Place unit tests alongside source files or in `src/test/`.
- Use Vitest with React Testing Library for component tests.
- E2E tests go in `e2e/` directory using Playwright.
- Always run `deno task test:unit` before submitting changes.

## Common Patterns

### State Management (Jotai)
```tsx
// Define atoms in src/store/
import { atom } from 'jotai';
export const logsAtom = atom<LogEntry[]>([]);

// Use in components
import { useAtom } from 'jotai';
const [logs, setLogs] = useAtom(logsAtom);
```

### Web Workers
Log parsing is offloaded to workers in `src/workers/`. Use the message-passing pattern to communicate with workers.

## CI/CD

The project uses Dagger for CI. Run locally with:
```bash
deno task ci
```

GitHub Actions workflows are in `.github/workflows/`:
- `test.yml` - Runs tests on PR
- `release.yml` - Builds and releases binaries

## Important Notes

- WebUSB only works in Chromium-based browsers.
- The project supports demo/mock mode for testing without a device.
- Binaries can be compiled with `deno task compile`.
