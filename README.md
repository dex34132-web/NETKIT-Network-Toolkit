# NETKIT Network Toolkit

NETKIT is an offline-first React/Vite network engineering toolkit. It includes
CIDR and subnet calculators, IP conversion and range tools, VLAN planning,
port references, a vendor-aware command builder, local notes, activity
tracking, theme preferences, and workspace export.

All calculations and workspace data run in the browser. No backend or
environment secrets are required.

## Repository layout

```text
artifacts/netkit/       React/Vite application
artifacts/netkit/src/   Application source
artifacts/netkit/public/Static public assets
vercel.json             Vercel build, SPA routing, and headers
docs/VERCEL_DEPLOYMENT.md
```

## Requirements

- Node.js 20 or newer
- pnpm 10.26.1 or a compatible pnpm 10 release

## Run locally

```bash
pnpm install
pnpm --filter @workspace/netkit run dev
```

The Replit preview workflow supplies `PORT=19465` and `BASE_PATH=/`. For a
manual Vite run, the app now defaults to `PORT=5173` and `BASE_PATH=/` when
those variables are not set:

```bash
pnpm --filter @workspace/netkit run dev
```

## Validate and build

```bash
pnpm run typecheck:netkit
pnpm run build:netkit
```

The production files are generated at:

```text
artifacts/netkit/dist/public
```

## Deploy to Vercel

The repository is configured for a root-directory Vercel project. Import the
GitHub repository and keep these settings:

- **Root Directory:** `.`
- **Framework preset:** Other
- **Install command:** `pnpm install --frozen-lockfile`
- **Build command:** `pnpm run build:netkit`
- **Output directory:** `artifacts/netkit/dist/public`
- **Environment variables:** none required

`vercel.json` already supplies those settings, the SPA fallback for routed
pages, immutable caching for built assets, and basic security headers.

For the full dashboard and CLI instructions, see
[`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md).

## Deploy with the Vercel CLI

From the repository root:

```bash
pnpm dlx vercel login
pnpm dlx vercel link
pnpm dlx vercel --prod
```

When prompted during linking, select the existing Vercel team/project or
create a new project. Do not change the root directory away from the
repository root; the checked-in `vercel.json` handles the monorepo path.

## GitHub workflow

```bash
git status
git add .
git commit -m "Prepare NETKIT for Vercel deployment"
git push origin main
```

After the repository is connected to Vercel, pushes to `main` can trigger
automatic production deployments.