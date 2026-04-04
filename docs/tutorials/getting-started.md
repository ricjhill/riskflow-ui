# Getting Started

Set up the RiskFlow UI project and run the dev server. This takes about 5 minutes.

## Prerequisites

- **Node.js 22+** — check with `node --version`
- **RiskFlow API** running on `http://localhost:8000` — see the [RiskFlow repo](https://github.com/ricjhill/riskflow) for setup instructions

## 1. Clone and install

```bash
git clone git@github.com:ricjhill/riskflow-ui.git
cd riskflow-ui
npm install
```

## 2. Configure the API URL

```bash
cp .env.example .env
```

The default `.env` points to `http://localhost:8000`. If your API runs elsewhere, edit `VITE_API_URL`.

## 3. Start the dev server

```bash
npm run dev
```

Open http://localhost:5173. The page hot-reloads on file changes.

## 4. Verify the toolchain

Run the full check suite to confirm everything works:

```bash
npm test           # Vitest — all tests should pass, 0 failed
npx tsc -b         # TypeScript — should produce no output (clean)
npm run lint        # ESLint — should produce no output (clean)
npm run format:check  # Prettier — should say "All matched files use Prettier code style!"
```

## Next steps

- Read the [Architecture](../explanation/architecture.md) guide to understand the project structure
- See [Run with Docker](../how-to/docker.md) to start the full stack (UI + API + Redis) in one command
