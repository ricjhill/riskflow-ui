# Tutorial: Run the Full Stack

Get RiskFlow running end-to-end: API backend, Redis cache, and React UI. Takes about 5 minutes.

## Prerequisites

- **Docker and Docker Compose** — check with `docker compose version`
- **Both repos cloned as siblings:**
  ```
  ~/projects/
    riskflow/        # API backend
    riskflow-ui/     # React frontend
  ```

## 1. Configure the API key

The API uses Groq for AI-powered column mapping. Get a key at https://console.groq.com, then:

```bash
cd riskflow
cp .env.example .env
```

Edit `.env` and set `GROQ_API_KEY=gsk_your_key_here`.

## 2. Start the backend stack

```bash
cd riskflow
docker compose up -d
```

This starts three services on the `riskflow` Docker network:

| Service | Port | What it does |
|---------|------|-------------|
| `api` | 8000 | FastAPI backend — file upload, SLM mapping, validation |
| `redis` | 6379 | Cache for mapping results (speeds up repeat uploads) |
| `gui` | 8501 | Streamlit dev GUI (optional, separate from React UI) |

Verify the API is running:

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

## 3. Start the UI

```bash
cd riskflow-ui
docker compose up -d
```

This starts one service that joins the existing `riskflow` network:

| Service | Port | What it does |
|---------|------|-------------|
| `ui` | 3000 | nginx serving the React app, proxying API calls to the backend |

Open **http://localhost:3000** — you should see the RiskFlow UI homepage with the navigation header.

## 4. Test the workflow

1. Click **Flow Mapper** in the navigation
2. Select a schema from the dropdown (e.g., "standard_reinsurance")
3. Upload a CSV bordereaux file with columns like `Policy No.`, `Start`, `End`, `TSI`, `GWP`, `Ccy`
4. The AI maps your columns to the target schema — review the mapping canvas
5. Edit any incorrect mappings with two clicks (source → target)
6. Click **Save Mappings**, then **Finalise** to validate all rows

## 5. Verify everything is connected

```bash
# Check all containers are running
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

# Check both stacks share the network
docker network inspect riskflow --format '{{range .Containers}}{{.Name}} {{end}}'

# Hit the API through the UI's nginx proxy
curl http://localhost:3000/health
# → {"status":"ok"}
```

## Stopping

```bash
# Stop just the UI
cd riskflow-ui
docker compose down

# Stop the backend stack
cd riskflow
docker compose down
```

The stacks are independent — stopping one doesn't affect the other.

## Rebuilding after code changes

```bash
# Rebuild the UI after frontend changes
cd riskflow-ui
docker compose up -d --build

# Rebuild the API after backend changes
cd riskflow
docker compose up -d --build
```

## Troubleshooting

**"network riskflow declared as external, but could not be found"**
Start the riskflow backend stack first — it creates the `riskflow` network.

**UI loads but API calls fail (502 Bad Gateway)**
The API container isn't running or isn't on the `riskflow` network. Check with `docker ps` and `docker network inspect riskflow`.

**Schema dropdown is empty**
The API is running but has no schemas loaded. Check that `riskflow/schemas/` contains `.yaml` schema files.

## Development mode (without Docker)

For local development with hot reload, see [Getting Started](getting-started.md). You'll need:
- `docker compose up -d` in riskflow (for the API)
- `npm run dev` in riskflow-ui (Vite dev server on port 5173)
