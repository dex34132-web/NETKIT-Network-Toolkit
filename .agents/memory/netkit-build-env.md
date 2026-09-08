---
name: NETKIT build environment
description: Environment-specific requirements for manually validating the NETKIT web artifact.
---

Manual Vite validation for NETKIT requires both `PORT` and `BASE_PATH`; the managed workflow supplies them automatically, while direct build commands do not.

**Why:** The artifact's Vite config intentionally fails fast when either routing or port configuration is missing.

**How to apply:** Use a command such as `PORT=19465 BASE_PATH=/netkit pnpm --filter @workspace/netkit run build` for local production-build verification.