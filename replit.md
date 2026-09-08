# NETKIT Network Toolkit

NETKIT is a dark, responsive network engineering workspace for subnet math, IP conversion, VLAN planning, port references, command generation, notes, and export.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/netkit/src/App.tsx` — routed pages, local calculators, notes state, shared shell, and navigation
- `artifacts/netkit/src/index.css` — NETKIT theme tokens, grid texture, responsive styles, and motion
- `artifacts/netkit/src/pages/not-found.tsx` — fallback route
- `attached_assets/image_1788787684507.png` — original visual reference

## Architecture decisions

- The first release is frontend-only and keeps calculator, notes, and export state in the browser; no external services are required.
- Wouter provides the route-aware shell so every tool is directly addressable and navigation remains lightweight.
- Network calculations use deterministic client-side IPv4 helpers so results appear immediately while typing and remain usable offline.
- The UI intentionally removes the reference image's greeting, quote, and offline/status messaging.

## Product

NETKIT includes a dashboard, CIDR/subnet calculator, IP conversions, VLAN planner, IP range checker, port reference, command builder, notes workspace, and export workspace. Notes persist in localStorage.

## User preferences

- Match the provided dark NETKIT reference while improving it into a responsive, navigable application.
- Do not include the reference greeting, bottom-right quote, or offline/local-status UI.

## Gotchas

- Vite build checks require `PORT` and `BASE_PATH`; the managed workflow supplies them automatically.
- Use the managed `artifacts/netkit: web` workflow for preview instead of running the root workspace dev command.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
