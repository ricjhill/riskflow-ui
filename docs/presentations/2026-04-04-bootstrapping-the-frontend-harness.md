# Bootstrapping the Frontend Harness

**RiskFlow UI Engineering Session — 4 April 2026**
**Duration: 40 minutes**

---

## Agenda

| # | Section | Time |
|---|---------|------|
| 1 | What We Built | 3 min |
| 2 | Starting Point: What Existed Before | 3 min |
| 3 | Docker: Multi-Stage Build + nginx Proxy | 7 min |
| 4 | CI/CD: Closing the Local-Only Gap | 5 min |
| 5 | Documentation: Replacing the Boilerplate | 5 min |
| 6 | The Code Review Loop | 7 min |
| 7 | Pre-Commit Hook Fix: Multi-Repo Problem | 3 min |
| 8 | By the Numbers | 3 min |
| 9 | Lessons Learned | 4 min |

---

## 1. What We Built (3 min)

Three PRs, three layers of infrastructure:

| PR | Title | Theme |
|----|-------|-------|
| #1 | Docker containerization with nginx reverse proxy | Infrastructure |
| #2 | CI/CD pipelines for quality checks and Docker delivery | Harness |
| #3 | Replace boilerplate README and add Diataxis docs tree | Documentation |

Starting point: a Vite scaffold with an API client, types, and a Claude Code harness (hooks, rules, skills) — but no way to run it in Docker, no CI/CD, and a README that said "React + TypeScript + Vite".

Ending point: a project that can be started with `docker compose up -d`, has quality gates enforced in GitHub Actions on every PR, and has 8 documentation pages covering everything that exists today.

---

## 2. Starting Point: What Existed Before (3 min)

The initial scaffold (commit `45432aa`) shipped a working foundation:

### What was ready

| Component | Status |
|-----------|--------|
| API client (`src/api/client.ts`) | 11 typed endpoint wrappers |
| TypeScript types (`src/types/api.ts`) | 9 interfaces matching the RiskFlow API |
| CLAUDE.md | Full project context, TDD workflow, Definition of Done |
| Pre-commit hook | vitest, tsc, eslint, prettier — blocks commit on failure |
| Post-edit hook | Auto-formats .ts/.tsx/.css/.json after Edit/Write |
| Post-failure hook | Structured diagnostics on vitest/tsc/eslint failures |
| Enforce-create-pr hook | Forces `/create-pr` skill for PR creation |
| Create-pr skill | Agent-to-agent code review before PR |
| Testing rules | Coverage requirements (happy path, boundaries, edge cases, errors) |
| Operating principles | Humans design constraints, agents generate code |

### What was missing

| Gap | Risk |
|-----|------|
| No Docker | Can't run the full stack without manual setup |
| No CI/CD | Quality gates only enforce inside Claude Code — manual commits bypass everything |
| README is Vite boilerplate | No one knows what this project is or how to run it |
| No docs/ | No tutorials, no reference, no architecture explanation |

This session closed all four gaps.

---

## 3. Docker: Multi-Stage Build + nginx Proxy (7 min)

### The architecture decision

The UI is a static React app that needs to talk to the RiskFlow API. Two options:

| Option | How | Trade-off |
|--------|-----|-----------|
| CORS | UI on port 5173, API on port 8000, configure CORS headers | Extra config, browser preflight requests |
| Reverse proxy | nginx serves UI and proxies API routes | Single origin, no CORS, production-like |

Chose reverse proxy. In Docker, the client uses relative URLs and nginx routes them.

### Multi-stage Dockerfile

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=""
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
```

Key decision: `VITE_API_URL=""` at build time. The API client code:

```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
```

Empty string is truthy in the `??` check, so `BASE_URL` becomes `""` — all fetch calls use relative URLs. The `??` fallback to `localhost:8000` only triggers when the env var is undefined (local dev without `.env`).

### nginx proxy config

```nginx
server {
    listen 3000;
    client_max_body_size 50m;

    location /sessions { proxy_pass http://api:8000; }
    location /schemas  { proxy_pass http://api:8000; }
    location /sheets   { proxy_pass http://api:8000; }
    # ... plus /upload, /health, /corrections, /jobs

    location / { try_files $uri $uri/ /index.html; }
}
```

Three things the code reviewer caught:

1. **Missing `client_max_body_size`** — nginx defaults to 1 MB, which silently rejects bordereaux uploads with a 413. Set to 50 MB.
2. **"Self-contained" was misleading** — the compose file depends on `../riskflow` for both `build` and `env_file`. PR text corrected.
3. **Prefix matching gotcha** — `location /sessions` also matches `/sessions-other`. Low risk given the current API surface, but noted for awareness.

### Self-contained docker-compose

```yaml
services:
  ui:
    build: .
    ports: ["3000:3000"]
    depends_on: [api]
  api:
    build: ../riskflow
    ports: ["8000:8000"]
    env_file: ../riskflow/.env
    environment: [REDIS_URL=redis://redis:6379]
    depends_on: [redis]
  redis:
    image: "redis:alpine"
    ports: ["6379:6379"]
```

Lives in riskflow-ui — no changes needed in the riskflow repo. Requires `../riskflow` as a sibling directory.

---

## 4. CI/CD: Closing the Local-Only Gap (5 min)

### The problem

The Claude Code harness enforces quality gates via hooks — but only inside Claude Code sessions. A developer committing from their IDE, or a merge via the GitHub UI, bypasses all checks. The harness is strong locally but invisible to GitHub.

### CI: Mirror the pre-commit hook

```yaml
# .github/workflows/ci.yml — runs on PRs and pushes to main
quality:
  steps:
    - npm ci
    - npm test           # vitest
    - npx tsc -b         # TypeScript
    - npm run lint        # ESLint
    - npm run format:check  # Prettier

docker-build:
  needs: quality
  if: github.event_name == 'pull_request'
  steps:
    - docker build -t riskflow-ui:test .
```

The `quality` job runs the identical four checks as the pre-commit hook. The `docker-build` job verifies the Dockerfile compiles — only on PRs, since CD handles builds on main.

### CD: Build and push on green main

```yaml
# .github/workflows/cd.yml — triggered by workflow_run
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

build-and-push:
  if: github.event.workflow_run.conclusion == 'success'
  steps:
    - docker build + tag (latest + commit SHA)
    - docker push to ghcr.io
```

Same pattern as the riskflow backend CD. The `workflow_run` trigger means CD never fires unless CI is green.

### What's not covered yet

| Gap | Why deferred |
|-----|-------------|
| JUnit test reporting | Only 1 test — add when test count grows |
| Security scanning (npm audit) | Follow-up item |
| Docker layer caching | Optimisation, not correctness |
| Path filtering on docker-build | Burns extra minutes on docs-only PRs |

---

## 5. Documentation: Replacing the Boilerplate (5 min)

### Before

The README was 73 lines of Vite template:

```markdown
# React + TypeScript + Vite
This template provides a minimal setup to get React working in Vite with HMR...
```

No mention of RiskFlow, no setup instructions, no architecture.

### After

**README.md** — project intro, prerequisites, quick-start (Docker + local), development commands, architecture diagram, workflow description.

**docs/** — 8 pages following the Diataxis framework:

| Category | Page | What it covers |
|----------|------|----------------|
| Tutorial | getting-started.md | Clone → install → dev server → verify toolchain |
| How-to | docker.md | Full stack with docker compose, how nginx proxying works |
| How-to | add-api-endpoint.md | Type → client function → nginx route → test |
| Explanation | architecture.md | Feature-based structure, dependency direction, styling, state |
| Explanation | api-integration.md | Base URL resolution, error handling, session workflow sequence |
| Reference | api-client.md | All 11 functions with signatures and HTTP endpoints |
| Reference | types.md | All 9 interfaces with field descriptions |

### What the reviewer verified

The code-reviewer agent checked every function signature in `api-client.md` against `src/api/client.ts` and every interface in `types.md` against `src/types/api.ts` — **zero discrepancies** across 11 functions and 9 interfaces.

It also verified all 14 internal links between doc pages — no broken links.

Two items it caught:

1. **"Should show 1 passed"** in the tutorial — will go stale when tests are added. Changed to "all tests should pass, 0 failed".
2. **Empty directories described as populated** — components/, hooks/, and flow-mapper/ are empty placeholders. Annotated as "(empty — populated as features are built)".

---

## 6. The Code Review Loop (7 min)

### Three PRs, three reviews

Every PR went through the `code-reviewer` agent before creation. The reviewer reads the full diff and the draft PR description, then returns APPROVE, REVISE, or BLOCK.

| PR | First verdict | Issues found | Resolution |
|----|--------------|-------------|------------|
| #1 Docker | REVISE | Missing `client_max_body_size` (413 on uploads); "self-contained" claim misleading | Added 50m limit; corrected PR text |
| #2 CI/CD | REVISE | `actions/checkout@v6` flagged as non-existent | Verified backend CI green with @v6 — concern withdrawn |
| #3 Docs | REVISE | Stale test count in tutorial; empty dirs described as populated | Future-proofed phrasing; annotated empty dirs |

### What the reviewer catches

**Functional bugs:**
- The `client_max_body_size` omission was a real production bug. Nginx's 1 MB default would silently reject any bordereaux file over 1 MB with a 413 — no error message, no explanation. Users would see their upload fail with no indication why.

**PR text accuracy:**
- "Self-contained" implied the compose file works in isolation. It doesn't — it requires `../riskflow` to exist. The reviewer flagged the specific lines (`build: ../riskflow`, `env_file: ../riskflow/.env`) that contradict the claim.
- Every factual assertion in the PR description was verified against the actual diff. This catches copy-paste errors, overclaims, and descriptions that drift from the code during revision.

**Future-proofing:**
- The tutorial's "should show 1 passed" is accurate today but wrong the moment a second test is added. The reviewer didn't just flag it — it suggested a specific rewording that ages better.

### Cost vs value

Each review adds ~2-4 minutes per PR. In this session:
- 1 functional bug caught (client_max_body_size)
- 2 PR text accuracy issues caught
- 2 future-proofing improvements caught

The functional bug alone justifies the review loop — it would have been discovered in production as a confusing 413 error with no obvious cause.

---

## 7. Pre-Commit Hook Fix: Multi-Repo Problem (3 min)

### The bug

The pre-commit hook uses `$CLAUDE_PROJECT_DIR` to find the project root:

```bash
cd "$CLAUDE_PROJECT_DIR" || exit 0
npm test  # etc.
```

But `$CLAUDE_PROJECT_DIR` points to the **primary** working directory — `/home/ric/riskflow` (the Python backend). When committing in riskflow-ui, the hook cd's to riskflow and runs `npm test` — which fails because there's no `package.json`.

### The fix

Resolve the actual repo root from the git working directory and compare it to the hook's own location:

```bash
REPO_ROOT=$(git -C "${CLAUDE_WORKING_DIR:-$CLAUDE_PROJECT_DIR}" \
  rev-parse --show-toplevel 2>/dev/null)
UI_ROOT=$(cd "$(dirname "$0")/../.." && pwd)

if [[ "$REPO_ROOT" != "$UI_ROOT" ]]; then
  exit 0  # Not our repo — skip
fi

cd "$UI_ROOT" || exit 0
```

`UI_ROOT` is derived from the hook script's own path (`dirname "$0"` → `.claude/hooks/` → `../..` → repo root). This works regardless of which repo `$CLAUDE_PROJECT_DIR` points to.

### Broader lesson

Multi-repo setups with shared Claude Code sessions need hooks that are repo-aware. The riskflow backend hook has the same `cd "$CLAUDE_PROJECT_DIR"` pattern but happens to work because it *is* the primary project. Any secondary working directory hook needs this fix.

---

## 8. By the Numbers (3 min)

| Metric | Before this session | After this session |
|--------|--------------------|--------------------|
| PRs merged | 0 | 3 (+ 1 open) |
| Docker services | 0 | 3 (ui + api + redis) |
| CI/CD workflows | 0 | 2 (CI + CD) |
| Documentation pages | 0 | 9 (README + 8 docs/) |
| Hooks | 4 | 4 (1 fixed) |
| Lines added | — | ~780 net |
| Tests | 1 | 1 (infrastructure-only session) |

### PRs this session

| PR | Title | Lines | Review verdict |
|----|-------|-------|----------------|
| #1 | Docker containerization with nginx reverse proxy | +96 | REVISE → fix → merged |
| #2 | CI/CD pipelines for quality checks and Docker delivery | +80 | REVISE → verified → open |
| #3 | Replace boilerplate README and add Diataxis docs tree | +685 | REVISE → fix → merged |

### Harness inventory

| Layer | Component | Status |
|-------|-----------|--------|
| Local | Pre-commit hook (vitest, tsc, eslint, prettier) | Shipped (initial) + fixed (multi-repo) |
| Local | Post-edit auto-format | Shipped (initial) |
| Local | Post-failure diagnostics | Shipped (initial) |
| Local | Enforce-create-pr | Shipped (initial) |
| CI | Quality gate (vitest, tsc, eslint, prettier) | **New** |
| CI | Docker build verification | **New** |
| CD | GHCR image push (latest + SHA) | **New** |
| Docs | README + 8-page Diataxis tree | **New** |
| Rules | Operating principles + testing rules | Shipped (initial) |
| Skills | Create-pr with code-reviewer gate | Shipped (initial) |

---

## 9. Lessons Learned (4 min)

### 1. Infrastructure PRs need the code reviewer too

The `client_max_body_size` bug was in a nginx config file — not TypeScript, not React, not application code. The reviewer still caught it because it understood the upload use case (bordereaux files can be several MB) and checked whether nginx's defaults would handle it. Infrastructure changes can introduce functional bugs just as easily as application changes.

### 2. PR text accuracy matters more than it seems

Two of three PRs had PR text corrections. "Self-contained" sounds good but was wrong. "Should show 1 passed" is true today but fragile. The reviewer verifying every claim against the actual diff caught both. PR descriptions become institutional memory — inaccurate descriptions mislead future readers.

### 3. Multi-repo hooks need explicit repo detection

The `$CLAUDE_PROJECT_DIR` assumption works in single-repo setups. It breaks silently in multi-repo setups — the hook runs, it fails, and the error message ("no package.json") doesn't point to the root cause (wrong directory). Deriving the repo root from the hook's own filesystem location is robust regardless of how the Claude Code environment is configured.

### 4. The scaffold determines the session's velocity

The initial scaffold shipped a complete harness: CLAUDE.md, 4 hooks, 2 rules, 1 skill, pre-configured permissions. This session added Docker, CI/CD, and documentation — but never had to fix a broken hook, write a missing rule, or configure permissions. The infrastructure work was additive, not corrective. A well-built scaffold means the first real session is productive, not remedial.

### 5. Docs-only PRs are the highest-accuracy-risk PRs

No code changed in PR #3, yet the reviewer found two issues. Documentation claims can't be tested by vitest or tsc. The reviewer's value on docs PRs is specifically accuracy verification — checking that every function signature, every interface field, and every directory description matches the current codebase. Automated checks can't do this. The reviewer's 11-function, 9-interface, 14-link audit took seconds and found zero discrepancies — plus two staleness risks.

### 6. Docker before CI/CD, CI/CD before docs

The ordering was deliberate:
1. **Docker first** — the CI needs to verify the Dockerfile builds
2. **CI/CD second** — enforces quality gates before docs are merged
3. **Docs last** — can describe Docker and CI/CD accurately because they already exist

Each PR built on the previous one. Reversing the order would have produced docs that described things that didn't exist yet, or CI that couldn't verify Docker builds.
