# Getting Started (Development Mode)

Set up the RiskFlow UI project for local development with hot reload.

For running the full stack with Docker instead, see [Run the Full Stack](run-the-full-stack.md).

## Prerequisites

- **Node.js 22+** — check with `node --version`
- **RiskFlow API** running on `http://localhost:8000` — start with `docker compose up -d` in the [RiskFlow repo](https://github.com/ricjhill/riskflow)

## 1. Clone and install

```bash
git clone git@github.com:ricjhill/riskflow-ui.git
cd riskflow-ui
npm install
```

## 2. Start the dev server

```bash
npm run dev
```

Open http://localhost:5173. The page hot-reloads on file changes.

The dev server proxies API calls to the riskflow backend on `http://localhost:8000` (via `VITE_API_URL` in `.env`).

## 3. Verify the toolchain

Run the full check suite to confirm everything works:

```bash
npm test              # Vitest — all tests should pass
npx tsc -b            # TypeScript — no output means clean
npm run lint          # ESLint — no output means clean
npm run format:check  # Prettier — "All matched files use Prettier code style!"
```

## Next steps

- [Run the Full Stack](run-the-full-stack.md) — Docker-based setup for both repos
- [Map a Bordereaux File](mapping-workflow.md) — walk through the upload → review → finalise workflow
- [Architecture](../explanation/architecture.md) — understand the project structure
- [Run with Docker](../how-to/docker.md) — details on how the Docker build and nginx proxy work
