# NETKIT Vercel Deployment Guide

This guide deploys the `artifacts/netkit` React/Vite app from the repository
root. NETKIT is a static single-page application, so Vercel hosts the built
files directly; no server, database, API key, or secret is needed.

## Option 1: Deploy from the Vercel dashboard

1. Open the Vercel dashboard and choose **Add New → Project**.
2. Import `dex34132-web/NETKIT-Network-Toolkit` from GitHub.
3. Use the repository root as **Root Directory** (`.`).
4. Use **Other** as the framework preset if Vercel asks for one.
5. Confirm these values:

   | Setting | Value |
   | --- | --- |
   | Install Command | `pnpm install --frozen-lockfile` |
   | Build Command | `pnpm run build:netkit` |
   | Output Directory | `artifacts/netkit/dist/public` |
   | Environment Variables | None |

6. Click **Deploy**.

These values are already stored in `vercel.json`, so leaving the detected
defaults is normally sufficient.

## Option 2: Deploy with the Vercel CLI

Install nothing permanently; run the CLI through pnpm:

```bash
pnpm dlx vercel login
pnpm dlx vercel link
pnpm dlx vercel --prod
```

During `vercel link`:

- Choose the correct Vercel account or team.
- Link to an existing project or create a new one.
- Keep the project root at the repository root.

The CLI reads `vercel.json` for the install command, build command, output
directory, SPA rewrite, and response headers.

## How routing works

NETKIT uses client-side routing for paths such as:

```text
/cidr-subnet
/subnet-calculator
/ip-tools
/ip-range-tools
/vlan-tools
/port-reference
/command-builder
/notes
/settings
```

The rewrite in `vercel.json` sends unknown document requests to
`/index.html`. This prevents a direct visit or refresh on one of those routes
from returning a 404. Static JavaScript, CSS, and public files are still
served normally.

## Local pre-deploy checks

Run these commands from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck:netkit
pnpm run build:netkit
```

To preview the production output locally:

```bash
PORT=4173 BASE_PATH=/ pnpm --filter @workspace/netkit run serve
```

Then open the local URL printed by Vite.

## Environment variables

No environment variables are required for Vercel. The Vite configuration
defaults to:

```text
PORT=5173
BASE_PATH=/
```

Replit still overrides those values for its routed preview. This keeps both
hosting environments compatible without maintaining separate build files.

## Automatic deployments from GitHub

After the Vercel project is linked:

1. A push to `main` creates a production deployment.
2. Pull requests receive preview deployments.
3. Vercel runs `pnpm install --frozen-lockfile`.
4. Vercel runs `pnpm run build:netkit`.
5. Vercel publishes `artifacts/netkit/dist/public`.

For a manual production update:

```bash
git add .
git commit -m "Describe the NETKIT change"
git push origin main
```

## Custom domain

In the Vercel project, open **Settings → Domains**, add the domain, and follow
the DNS records Vercel provides. No code change is needed for a custom domain.

## Troubleshooting

### Build fails because pnpm is not detected

Use the repository root as the Vercel Root Directory and ensure the GitHub
repository contains `pnpm-lock.yaml`. The root `package.json` also declares
`pnpm@10.26.1` as the package manager.

### A calculator route returns 404 on refresh

Confirm the Vercel project is using the committed `vercel.json` and that the
Root Directory is `.`. The SPA rewrite is required for direct routed URLs.

### The output directory is empty

Run `pnpm run build:netkit` locally and confirm that
`artifacts/netkit/dist/public/index.html` exists. The Vercel Output Directory
must be exactly `artifacts/netkit/dist/public`.

### The Replit preview stops working

The Replit artifact still supplies its own `PORT` and `BASE_PATH` values. Check
that the managed workflow is running:

```bash
pnpm --filter @workspace/netkit run dev
```

The Vercel defaults were added only as a fallback for hosts that do not
provide Replit's preview variables.