# RiskFlow UI

React frontend for the [RiskFlow](https://github.com/ricjhill/riskflow) reinsurance data mapping API. Upload bordereaux spreadsheets, review AI-suggested column mappings, edit them, and finalise to validate rows — all through an interactive browser-based workflow.

## Documentation

- [Getting started](docs/tutorials/getting-started.md) — set up the project and run the dev server
- [Architecture](docs/explanation/architecture.md) — feature-based structure, API integration, data flow
- [API client reference](docs/reference/api-client.md) — typed fetch wrappers and response types
- [Full documentation index](docs/index.md) — tutorials, how-to guides, explanations, reference

## Prerequisites

- Node.js 22+
- The [RiskFlow API](https://github.com/ricjhill/riskflow) running on `http://localhost:8000` (or configure `VITE_API_URL`)

## Getting Started

### Docker (recommended)

Starts the UI, API, and Redis together — no separate setup required.

```bash
# Requires ../riskflow to exist as a sibling directory
cp ../riskflow/.env.example ../riskflow/.env
# Edit ../riskflow/.env and set GROQ_API_KEY=gsk_your_key_here

docker compose up -d
```

Open http://localhost:3000 for the UI, or http://localhost:8000/health for the API.

### Local development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start dev server (assumes RiskFlow API is running on localhost:8000)
npm run dev
```

Open http://localhost:5173.

## Development

```bash
# Run tests
npm test

# Type check
npx tsc -b

# Lint and format
npm run lint
npm run format:check
```

## Architecture

Feature-based. Dependencies point inward: features use components/hooks/api, never the reverse.

```
src/
  api/               # Typed fetch wrappers for the RiskFlow REST API
  components/        # Shared UI components (buttons, tables, layouts)
  features/
    flow-mapper/     # Interactive mapping workflow (upload → review → finalise)
  hooks/             # Custom React hooks
  types/             # Shared TypeScript types (API response shapes)
  test/              # Test setup and utilities
```

## Stack

React 19, TypeScript 5.9, Vite 8, Vitest, ESLint, Prettier

## Workflow

The **Flow Mapper** is the core user workflow:

1. **Upload** — pick a bordereaux file (CSV/XLSX), select a target schema
2. **Review** — see AI-suggested column mappings with confidence scores
3. **Edit** — adjust mappings, mark headers as unmapped, add custom target fields
4. **Finalise** — validate all rows against the schema, see errors and valid records

The UI communicates with the RiskFlow API via typed client functions in `src/api/client.ts`. See the [API client reference](docs/reference/api-client.md) for details.
