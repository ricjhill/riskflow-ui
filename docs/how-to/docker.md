# Run with Docker

Start the UI container and connect it to the running RiskFlow API stack.

## Prerequisites

- Docker and Docker Compose
- The [riskflow](https://github.com/ricjhill/riskflow) stack running (`docker compose up -d` in the riskflow repo)

## 1. Start the riskflow stack first

The UI connects to the API via a shared Docker network. Start the backend stack:

```bash
cd ../riskflow
docker compose up -d
```

This starts `api` (port 8000), `redis` (port 6379), and `gui` (port 8501) on the `riskflow` network.

## 2. Start the UI

```bash
docker compose up -d
```

This starts one service:

| Service | Port | Description |
|---------|------|-------------|
| `ui` | 3000 | nginx serving the Vite build, proxying API calls to the riskflow stack |

Open http://localhost:3000 for the UI.

## How it works

The UI container joins the `riskflow` Docker network (defined as `external: true`). This lets nginx reach the `api` service by hostname — no duplicate API or Redis containers needed.

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

Note: this only stops the UI container. The riskflow stack (API + Redis) continues running independently.
