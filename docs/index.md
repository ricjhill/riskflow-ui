# RiskFlow UI Documentation

RiskFlow UI is a React frontend for the RiskFlow reinsurance data mapping API. Users upload bordereaux spreadsheets, review AI-suggested column mappings, edit them interactively, and finalise to validate rows against a target schema.

---

## Tutorials — Learn by doing

- [Getting Started](tutorials/getting-started.md) — set up the project and run the dev server

## How-to Guides — Solve a specific problem

- [Run with Docker](how-to/docker.md) — start the full stack with docker compose
- [Add a new API endpoint](how-to/add-api-endpoint.md) — extend the API client and types

## Explanation — Understand how it works

- [Architecture](explanation/architecture.md) — feature-based structure, dependency rules, data flow
- [API Integration](explanation/api-integration.md) — how the UI talks to the RiskFlow backend

## Reference — Look up details

- [API Client](reference/api-client.md) — every exported function, parameters, return types
- [TypeScript Types](reference/types.md) — all shared interfaces (Session, Schema, ColumnMapping, etc.)

## Presentations

- [Bootstrapping the Frontend Harness](presentations/2026-04-04-bootstrapping-the-frontend-harness.md) — Docker, CI/CD, docs, and the code review loop (4 April 2026)
