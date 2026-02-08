# Contributing to NekoLog

Thank you for your interest in contributing to NekoLog! 🐱

## Getting Started

### Prerequisites

The easiest way to get started is using our **DevContainer** setup:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [VS Code](https://code.visualstudio.com/)
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Clone the repo and open it in VS Code
4. Click "Reopen in Container" when prompted

Alternatively, for local development, install [Deno](https://deno.land/) 2.0+.

### Running the Project

```bash
# Install dependencies
deno install

# Start dev server
deno task dev

# Run tests
deno task test:unit
```

## Project Structure

Understanding the codebase layout helps you navigate and contribute effectively:

```
NekoLog/
├── .devcontainer/        # DevContainer configuration
│   ├── Dockerfile        # Container image definition
│   └── devcontainer.json # VS Code DevContainer settings
├── .github/
│   └── workflows/        # GitHub Actions CI/CD pipelines
├── dagger/               # Dagger CI pipeline configuration
│   └── src/              # TypeScript-based CI definitions
├── docs/
│   └── screenshots/      # Documentation images
├── e2e/                  # End-to-end tests (Playwright)
├── public/               # Static assets (favicon, logos)
├── scripts/              # Build/utility scripts
├── src/                  # Main application source code
│   ├── components/       # React components
│   │   ├── ControlBar/   # Header controls (search, connect, etc.)
│   │   └── Viewer/       # Log display components
│   ├── constants/        # Application constants
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Jotai state atoms
│   ├── test/             # Test utilities and setup
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── workers/          # Web Workers (log parsing, etc.)
│   ├── App.tsx           # Root application component
│   └── main.tsx          # Application entry point
├── index.html            # HTML entry point
├── server.ts             # Development/production server
├── deno.json             # Deno configuration & tasks
├── vite.config.ts        # Vite bundler configuration
├── vitest.config.ts      # Vitest test configuration
└── playwright.config.ts  # Playwright E2E test configuration
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/components/` | React UI components, organized by feature |
| `src/workers/` | Web Workers for background processing (log parsing) |
| `src/store/` | Jotai atoms for global state management |
| `src/hooks/` | Reusable React hooks |
| `dagger/` | CI/CD pipeline code (runs locally via `deno task ci`) |
| `e2e/` | Playwright browser tests |

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/isofurabon/NekoLog/issues) to avoid duplicates
2. Open a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS information

### Suggesting Features

Open an issue with the `enhancement` label describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `deno task test`
5. Commit with clear messages
6. Push and open a Pull Request

### Pull Request Guidelines

- Keep changes focused and atomic
- Update documentation if needed
- Ensure all tests pass
- Follow the existing code style

## Code Style

- Use TypeScript with strict types
- Follow the existing patterns in the codebase
- Run `deno task lint` before committing

## Development Commands

| Command | Description |
|---------|-------------|
| `deno task dev` | Start development server |
| `deno task test:unit` | Run unit tests |
| `deno task lint` | Run linter |
| `deno task build` | Build for production |
| `deno task ci` | Run full CI pipeline locally |

## Questions?

Feel free to open an issue for any questions about contributing!
