---
name: NETKIT build environment
description: Environment-specific requirements for manually validating the NETKIT web artifact.
---

NETKIT's Vite config defaults to `PORT=5173` and `BASE_PATH=/` for generic hosts such as Vercel; Replit's managed workflow overrides them with its routed preview values.

**Why:** One build must work both inside Replit's artifact router and as a root-hosted static SPA on Vercel.

**How to apply:** Use `pnpm run typecheck:netkit && pnpm run build:netkit` for host-independent validation; set `PORT` and `BASE_PATH` only when reproducing the Replit preview.