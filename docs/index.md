# RiskFlow UI Documentation

RiskFlow UI is a React frontend for the RiskFlow reinsurance data mapping API. Users upload bordereaux spreadsheets, review AI-suggested column mappings, edit them interactively, and finalise to validate rows against a target schema.

---

## Tutorials — Learn by doing

- [Run the Full Stack](tutorials/run-the-full-stack.md) — get both repos running with Docker in 5 minutes
- [Getting Started (Dev Mode)](tutorials/getting-started.md) — set up the project for local development with hot reload
- [Map a Bordereaux File](tutorials/mapping-workflow.md) — walk through the full upload → review → finalise workflow

## How-to Guides — Solve a specific problem

- [Run with Docker](how-to/docker.md) — start the full stack with docker compose
- [Add a new API endpoint](how-to/add-api-endpoint.md) — extend the API client and types

## Explanation — Understand how it works

- [Architecture](explanation/architecture.md) — feature-based structure, dependency rules, styling, routing
- [Flow Mapper](explanation/flow-mapper.md) — the mapping workflow, graph construction, two-click snap interaction
- [API Integration](explanation/api-integration.md) — how the UI talks to the RiskFlow backend

## Reference — Look up details

- [API Client](reference/api-client.md) — every exported function, parameters, return types
- [TypeScript Types](reference/types.md) — all shared interfaces (Session, Schema, ColumnMapping, etc.)
- [Hooks](reference/hooks.md) — useSession, useSchemas
- [Components](reference/components.md) — Stepper, FileUpload, SchemaList, ApiStatus
- [Tooling](reference/tooling.md) — import boundary linter, version bump, change detection, release workflow
