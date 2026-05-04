# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

---

## OliSkins Frontend (`artifacts/oliskins`)

### Stores (Zustand + `persist`)

| Store file | LocalStorage key | Contents |
|---|---|---|
| `useCaseStore.ts` | `oliskins_cases_v1` | Paid cases (`Case[]`) |
| `useFreeCaseStore.ts` | `oliskins_free_cases_v1` | Free cases (`Case[]`) initialized from `data/freeCases.ts` |
| `useGameStore.ts` | `oliskins_state_v1` | Player state (balance, XP, inventory, cooldowns) |
| `useBattleStore.ts` | `oliskins_battles_v2` | Battle rooms |

### Case Type Extensions

`Case` in `lib/types.ts` carries two optional free-only fields:
- `tier?: number` — display tier (1–5)
- `requiredLevel?: number` — minimum player level to open

`FreeCase` (legacy type) still exists in `types.ts` but is only used as the source format in `data/freeCases.ts`. `useFreeCaseStore` converts them to `Case` on first load.

### Case Builder Editor (`EdytorSkrzynek`)

Two-tab editor: **Płatne** (paid) / **Darmowe** (free).
- Paid tab: shows `priceCents`, `modePricing` (Boost/Jester multipliers), `modeAvailability` toggles.
- Free tab: shows `tier` (1–5) + `requiredLevel` (≥1); hides price/mode sections; locks `priceCents` to 0.
- Export format: `{ schemaVersion: 1, paidCases: [...] }` or `{ schemaVersion: 1, freeCases: [...] }`.
- Import validated per tab type before writing to store.

### Free Case Opening Flow

`useGameStore.openFreeCase(caseId)` → reads from `useFreeCaseStore.getState().freeCases` → checks level + global 1h cooldown → picks weighted drop → adds to inventory.
