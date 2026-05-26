# Training Wheel Sandbox — Deployment Plan

**Status:** Deployment plan only. Not yet deployed.

**Current constraint:** The `/training-wheel/` path inside the main dashboard repo inherits Cloudflare Zero Trust protection tied to Richard's private email. It cannot be used for external youth/community access.

## Deployment Requirements

| Requirement | Detail |
|-------------|--------|
| Isolation | Fully separate from main dashboard domain |
| Access | No shared Zero Trust policy |
| Content | Static HTML only (this page only) |
| Login | None initially |
| Chatbot | Not yet |
| PHI | None |
| Forms | None |
| Backend | None |

## Preferred Approach: Separate Cloudflare Pages Project

**What you do in Cloudflare Dashboard:**

1. Go to Cloudflare Dashboard → Workers & Pages → Create → Pages
2. Connect to the same GitHub repo: `NeighborBridge/neighborbridge-dashboard`
3. Set build settings:
   - Build command: (none — static HTML)
   - Build output directory: `training-wheel`
4. Set project name: `neighborbridge-training-wheel`
5. Deploy → gets URL like `neighborbridge-training-wheel.pages.dev`

**Optional:** Add custom domain `training-wheel.richard272.workers.dev` (requires Workers Paid plan) or a simple `*.pages.dev` subdomain.

**Resulting isolation:**
- Separate domain — no shared cookies/auth
- Separate Cloudflare project — no shared config
- No dashboard files accessible (only `training-wheel/` directory exposed)
- Can later add Access policy for specific users without touching main dashboard

## Temporary Offline Option (Available Now)

- Static HTML: `training-wheel/index.html`
- PDF export: `training-wheel/training-wheel-sandbox.pdf`
- Can be shared offline for review without any cloud deployment

## What Not to Do

- ❌ Do not share the main dashboard URL (`neighborbridge-dashboard.richard272.workers.dev`)
- ❌ Do not add Jude to main dashboard Zero Trust policy
- ❌ Do not rely on `/training-wheel/` path for external access
- ❌ Do not use Discord as primary infrastructure

## When to Consider Separate Deployment

- Sandbox concept matures
- Trusted external users need access
- Chatbot functionality is added
- Governance requirements become more complex

Until then: **offline review only.**
