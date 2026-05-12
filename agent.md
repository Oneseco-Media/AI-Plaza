# AI-Plaza — Agent Guide

## Overview

AI-Plaza is a **pnpm monorepo** built with TypeScript 5.9. It hosts a collection of AI-powered web artifacts (React frontends + Express backends) alongside shared library packages. The primary showcase is **AI Town**: a real-time, dark-fantasy RPG world simulation where characters roam a tile map, interact via AI-generated dialogue, and react to dynamic world events — all powered by OpenAI.

---

## Monorepo Layout

```
AI-Plaza/
├── artifacts/               # Standalone deployable apps
│   ├── ai-town/             # Frontend-only AI Town (Vite + React + Phaser)
│   ├── ai-town-fullstack/   # Fullstack AI Town (Vite frontend + Express server)
│   ├── api-server/          # Shared Express API server (CJS bundle via esbuild)
│   └── mockup-sandbox/      # UI mockup/prototyping sandbox (Vite + React)
├── lib/                     # Shared workspace packages
│   ├── api-client-react/    # Auto-generated React Query hooks (Orval from OpenAPI)
│   ├── api-spec/            # OpenAPI 3.1 YAML spec + Orval codegen config
│   ├── api-zod/             # Auto-generated Zod v4 schemas (Orval)
│   ├── db/                  # PostgreSQL schema + Drizzle ORM config
│   ├── integrations/        # Third-party integration adapters
│   │   └── openai_ai_integrations/
│   │       ├── src/client/  # OpenAI client-side helpers (audio, batch, image)
│   │       └── src/server/  # OpenAI server-side helpers
│   ├── integrations-openai-ai-react/   # React hooks for OpenAI integrations
│   └── integrations-openai-ai-server/  # Node.js OpenAI client singleton
├── scripts/                 # Utility scripts (TypeScript, run with tsx)
├── package.json             # Workspace root (pnpm only)
├── pnpm-workspace.yaml      # Workspace glob definitions
└── tsconfig.base.json       # Shared TypeScript base config
```

---

## Key Technologies

| Layer | Technology |
|---|---|
| Package manager | pnpm workspaces |
| Language | TypeScript 5.9 (ESM throughout) |
| Frontend framework | React 18 + Vite |
| Game engine | Phaser 3 |
| UI components | shadcn/ui (Radix UI + Tailwind CSS) |
| Animations | Framer Motion |
| Backend framework | Express 5 |
| Logging | Pino + pino-http |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4, drizzle-zod |
| API codegen | Orval (OpenAPI → React Query hooks + Zod schemas) |
| AI provider | OpenAI (`gpt-5-nano` for dialogue/events) |
| Build (server) | esbuild (CJS bundle) |
| State management | React local state + custom `Engine` class (pub/sub) |

---

## Artifacts

### `@workspace/ai-town` — Frontend-only AI Town

A Vite + React + Phaser 3 single-page application. Characters wander a tile map; the world engine drives faction politics, territory tension, and AI-generated dialogue via API calls to a separately running backend.

**Key files:**
- `src/lib/engine.ts` — The `Engine` class: pub/sub world state machine. Manages 15 characters, districts, factions, relationships, turn advancement, pathfinding, tasks, inventories, and calls the AI dialogue API.
- `src/components/PhaserGame.tsx` — Phaser scene integration as a React component.
- `src/pages/World.tsx` — Fullscreen Phaser view with play/pause/step controls.
- `src/pages/Dashboard.tsx` — Dashboard view: conversation log, global state matrix (districts, factions, relationships), and event stream.

**Dev:** `pnpm --filter @workspace/ai-town run dev`

### `@workspace/ai-town-fullstack` — Fullstack AI Town

Same frontend as `ai-town` but ships with its own Express server (`server/index.ts`) and AI Town API routes (`server/routes/ai-town.ts`). Designed for single-process deployment.

**Dev:** `pnpm --filter @workspace/ai-town-fullstack run dev`

### `@workspace/api-server` — Shared API Server

Standalone Express 5 API server built to a CJS bundle via esbuild. Includes:
- `src/app.ts` — Express app setup (CORS, pino-http, JSON body parsing).
- `src/routes/` — Route handlers. `health.ts` provides `GET /api/healthz`. `ai-town.ts` provides three AI endpoints (see below). `routes.ts` is the main application router stub.
- `src/storage.ts` — `IStorage` interface + `MemStorage` in-memory implementation (users CRUD).
- `src/lib/logger.ts` — Pino logger singleton.
- `src/static.ts` — Static file serving helper.

**Dev:** `pnpm --filter @workspace/api-server run dev`

### `@workspace/mockup-sandbox` — UI Mockup Sandbox

Vite + React workspace for prototyping UI components and page mockups in isolation.

---

## Shared Libraries

### `@workspace/api-spec`

Single source of truth for the HTTP API contract (`openapi.yaml`). Currently defines:
- `GET /api/healthz` → `HealthStatus { status: string }`

Run codegen after editing the spec:
```
pnpm --filter @workspace/api-spec run codegen
```

### `@workspace/api-client-react`

Auto-generated React Query hooks consumed by frontend apps. Generated from `api-spec/openapi.yaml` via Orval. Do not edit generated files directly.

### `@workspace/api-zod`

Auto-generated Zod v4 schemas matching the OpenAPI spec. Used for runtime validation in server routes.

### `@workspace/db`

Drizzle ORM configuration targeting PostgreSQL.
- `src/schema/schema.ts` — `users` table (id, username, password) + `insertUserSchema` + TypeScript types.
- `drizzle.config.ts` — Drizzle Kit config (reads `DATABASE_URL` from environment).

Push schema changes (dev only):
```
pnpm --filter @workspace/db run push
```

### `@workspace/integrations-openai-ai-server`

Exports a pre-configured `openai` client instance (Node.js). Consumed by any server-side package that needs to call the OpenAI API. Reads `OPENAI_API_KEY` from environment.

### `@workspace/integrations-openai-ai-react`

React hooks wrapping OpenAI integrations for client-side use.

---

## AI Town API Endpoints

All three endpoints live under `/api/ai-town` and use `gpt-5-nano` with short `max_completion_tokens` limits for speed. All include static fallbacks if the AI call fails.

| Method | Path | Purpose | Required body fields |
|---|---|---|---|
| `POST` | `/api/ai-town/dialogue` | Generate a short in-character speech line (≤15 words) for a character | `character`, `role`, `trait`, `worldMood` |
| `POST` | `/api/ai-town/world-event` | Generate a dramatic world-event announcement (≤20 words) | `eventType`, `worldMood` |
| `POST` | `/api/ai-town/task-outcome` | Generate a one-sentence task outcome narrative (≤15 words) | `characterName`, `task` |

---

## World Engine (`Engine` class)

Located in `artifacts/ai-town/src/lib/engine.ts` (also duplicated in `ai-town-fullstack`).

**Core concepts:**
- **WorldState** — `globalMood`, `districts` (tension 0–100, controlling faction), `factions` (power 0–100, leader), `relationships` (pair → 0–100), `turn`, `timeOfDay`, `weather`, `pois`.
- **Character** — 15 pre-defined characters with `role`, `persona` (aggressiveness, sociability, greed, curiosity), faction affiliation, position on a 50×40 tile map, health/energy, credits, inventory, XP.
- **Event** types: `MOOD_CHANGE`, `TERRITORY_SHIFT`, `FACTION_POWER`, `RELATIONSHIP_UPDATE`, `SYSTEM_ALERT`, `TASK_COMPLETED`, `FLOATING_TEXT`.
- **Plugin system** — `engine.on(eventType, handler)` registers handlers; `engine.subscribe(listener)` notifies UI on every state change.
- **Turn loop** — `engine.advanceTurn()` moves characters, resolves tasks, triggers dialogue, fires world events, and updates the global mood.

**Characters (roles):** Warrior, Mage, Rogue, Cleric, Paladin, Merchant.  
**Factions:** Synapse Cartel, Scrap Barons, CorpSec, Neon Syndicate.  
**Districts:** Neon Grid, The Rust Wastes, Aero Heights.

---

## Commands Reference

```bash
# Full typecheck across all packages
pnpm run typecheck

# Build all packages (typecheck + build)
pnpm run build

# Regenerate API hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only, requires DATABASE_URL)
pnpm --filter @workspace/db run push

# Run the standalone API server
pnpm --filter @workspace/api-server run dev

# Run the frontend-only AI Town (requires separate API server)
pnpm --filter @workspace/ai-town run dev

# Run the fullstack AI Town (frontend + backend in one process)
pnpm --filter @workspace/ai-town-fullstack run dev
```

---

## Environment Variables

| Variable | Required by | Purpose |
|---|---|---|
| `DATABASE_URL` | `@workspace/db` | PostgreSQL connection string |
| `OPENAI_API_KEY` | `@workspace/integrations-openai-ai-server` | OpenAI API access |
| `NODE_ENV` | `@workspace/api-server`, `ai-town-fullstack` | `development` / `production` |

---

## Development Notes

- **Package manager:** Use `pnpm` exclusively. Running `npm` or `yarn` is blocked by a `preinstall` script.
- **TypeScript paths:** Each package has its own `tsconfig.json` extending `tsconfig.base.json` at the root. The `lib/` packages are project references compiled first (`typecheck:libs`).
- **Generated code:** Files under `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` are auto-generated by Orval. Re-run codegen after changing `openapi.yaml`.
- **Storage:** The API server ships with `MemStorage` (in-memory). Swap it with a Drizzle-backed implementation and set `DATABASE_URL` to persist data.
- **AI model:** The world engine uses `gpt-5-nano` for all three AI endpoints. Change the `model` field in `src/routes/ai-town.ts` to upgrade.
- **Phaser integration:** The tile map is 50×40 tiles at 32 px/tile (1600×1280 logical px). Characters are rendered as colored rectangles with floating name labels.
