---
name: screenshot
description: Start dev server + headless Chrome, screenshot every route, and run element assertions
user_invocable: true
---

Take screenshots of every UI route and verify key elements are present. Uses `uvx rodney` for headless Chrome automation.

## Steps

### 1. Start dev server (if not running)

Check if a Vite dev server is already running:

```bash
lsof -ti:5173 || lsof -ti:5174
```

If no server is running, start one in the background:

```bash
npm run dev &>/tmp/vite-dev.log &
sleep 3
```

Read `/tmp/vite-dev.log` to find the port (look for `Local:   http://localhost:<port>/`). Store the port for subsequent commands.

### 2. Start Chrome (if not running)

```bash
uvx rodney status
```

If not running:

```bash
uvx rodney start
```

### 3. Discover routes

Read `src/App.tsx` and extract all `<Route path="..." />` entries. Build a list of routes to visit. Always include `/` (homepage).

### 4. Screenshot each route

For each route:

```bash
uvx rodney open http://localhost:<port><route>
uvx rodney waitload
uvx rodney waitstable
uvx rodney screenshot /tmp/screenshot-<route-slug>.png
```

Use the Read tool to view each screenshot and describe what you see.

Route slug: replace `/` with `home`, and other `/` with `-` (e.g. `/flow-mapper` → `flow-mapper`, `/api-status` → `api-status`).

### 5. Element assertions

After screenshots, run targeted assertions on key elements per route. These verify the page is functional, not just rendered.

**Homepage (`/`):**
```bash
uvx rodney exists "h1"
uvx rodney exists "nav a"
```

**Flow Mapper (`/flow-mapper`):**
```bash
uvx rodney open http://localhost:<port>/flow-mapper
uvx rodney waitload
uvx rodney waitstable
uvx rodney exists ".stepper, ol[role='list']"
uvx rodney exists "select#schema-select"
uvx rodney exists "[data-testid='file-input']"
```

**API Status (`/api-status`):**
```bash
uvx rodney open http://localhost:<port>/api-status
uvx rodney waitload
uvx rodney waitstable
uvx rodney exists "h2"
```

For any routes added in future PRs, derive sensible assertions from the component code (look for role attributes, data-testid, semantic HTML).

If an assertion fails (exit code 1), report it but continue with remaining checks.

### 6. Report

Present results as:

```
## Visual Smoke Test

### Screenshots
| Route | Screenshot | Status |
|-------|-----------|--------|
| / | [homepage](/tmp/screenshot-home.png) | ✓ rendered |
| /flow-mapper | [flow-mapper](/tmp/screenshot-flow-mapper.png) | ✓ rendered |
| /api-status | [api-status](/tmp/screenshot-api-status.png) | ✓ rendered |

### Element Assertions
| Route | Selector | Result |
|-------|----------|--------|
| / | h1 | ✓ exists |
| / | nav a | ✓ exists |
| /flow-mapper | stepper list | ✓ exists |
| /flow-mapper | schema select | ✓ exists |
| /flow-mapper | file input | ✓ exists |

### Failures
- <any failures, or "None">
```

### 7. Cleanup

Do NOT stop Chrome or the dev server — leave them running for further manual testing. Only stop if the user explicitly asks.

## Rules

- Never install rodney globally — always use `uvx rodney`
- If the dev server port changes, adapt — read the log to find it
- If Chrome crashes, restart with `uvx rodney start` and retry
- Show each screenshot to the user using the Read tool so they can see the visual output
- If a route requires API backend (e.g. schema list), note it in the report but don't fail — the page should still render its loading/empty state
