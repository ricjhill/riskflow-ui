# Run with Docker

Start the full stack — UI, API, and Redis — with a single command.

## Prerequisites

- Docker and Docker Compose
- The [riskflow](https://github.com/ricjhill/riskflow) repo checked out as a sibling directory (`../riskflow`)

## 1. Configure the API

The API needs a Groq API key. Create the `.env` file in the riskflow repo:

```bash
cp ../riskflow/.env.example ../riskflow/.env
# Edit ../riskflow/.env and set GROQ_API_KEY=gsk_your_key_here
```

## 2. Start everything

```bash
docker compose up -d
```

This starts three services:

| Service | Port | Description |
|---------|------|-------------|
| `ui` | 3000 | nginx serving the Vite build |
| `api` | 8000 | RiskFlow FastAPI backend |
| `redis` | 6379 | Session and cache storage |

Open http://localhost:3000 for the UI.

## How it works

The UI is built as a multi-stage Docker image:

1. **Build stage** — Node 22 runs `npm ci` and `npm run build` (Vite production build)
2. **Runtime stage** — nginx:alpine serves the static files on port 3000

`VITE_API_URL` is set to empty string at build time, so the React client uses relative URLs (e.g., `/sessions` instead of `http://localhost:8000/sessions`). nginx proxies all API routes to the `api` service:

- `/sessions`, `/schemas`, `/sheets`, `/upload`, `/health`, `/corrections`, `/jobs` → `api:8000`
- All other routes → `index.html` (SPA fallback for client-side routing)

The `client_max_body_size` is set to 50 MB to support large bordereaux file uploads.

## Rebuild after changes

```bash
docker compose up -d --build
```

## Tear down

```bash
docker compose down
```
