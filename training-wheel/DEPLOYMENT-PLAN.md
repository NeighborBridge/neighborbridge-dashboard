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

## Cloudflare Dashboard Steps (Manual)

**Step 1:** Go to https://dash.cloudflare.com → **Workers & Pages** tab.

**Step 2:** Click **Create** → **Pages** → **Connect to Git**.

**Step 3:** Select **NeighborBridge/neighborbridge-dashboard** from the repo list. (If prompted, authorize GitHub access.)

**Step 4:** Configure build settings:
- **Project name:** `neighborbridge-training-wheel`
- **Production branch:** `main`
- **Build command:** (leave blank — static HTML, no build step)
- **Build output directory:** `training-wheel`
- **Root directory (advanced):** (leave default `/`)

**Step 5:** Click **Save and Deploy**. Cloudflare Pages will clone the repo and serve only the `training-wheel/` directory at `neighborbridge-training-wheel.pages.dev`.

**Step 6 (optional):** Set custom domain:
- Go to project → **Custom domains** → **Set up custom domain**
- Enter `training-wheel.richard272.workers.dev` (requires Workers Paid plan)

**Step 7 (optional):** Add Zero Trust Access policy for specific users later, but **do not** use the same Access policy as the main dashboard.

**Resulting isolation:**
- ✅ Separate domain — no shared cookies/auth
- ✅ Separate Cloudflare project — no shared config
- ✅ Only `training-wheel/` directory exposed — no dashboard files accessible
- ✅ No login required by default
- ✅ Can add Access policy for specific users without touching main dashboard

## What the Deployed URL Serves

Only files in the `training-wheel/` directory are served:
- `index.html` — main sandbox page
- `training-wheel-sandbox.pdf` — PDF export (optional, could be removed)
- `DEPLOYMENT-PLAN.md` — this file (not visible in browser, but in Git)

**No access to:** stakeholder pages, manuscript pages, agent-ops, FQHC pages, or any other repository content.

## Verification Checklist

- [ ] `neighborbridge-training-wheel.pages.dev` loads without login
- [ ] Page shows Training Wheel Sandbox content, not main dashboard
- [ ] No internal dashboard links visible
- [ ] No login prompt (unless Access policy was explicitly added)
- [ ] Static page loads correctly
- [ ] No backend/API traffic generated

## Temporary Offline Option (Available Now)

- Static HTML: `training-wheel/index.html`
- PDF export: `training-wheel/training-wheel-sandbox.pdf`
- Can be shared offline for review without any cloud deployment

## What Not to Do

- ❌ Do not share the main dashboard URL (`neighborbridge-dashboard.richard272.workers.dev`)
- ❌ Do not add Jude to main dashboard Zero Trust policy
- ❌ Do not use the same Zero Trust policy for both projects
- ❌ Do not link from main dashboard to training wheel sandbox
- ❌ Do not add chatbot, forms, login, or analytics
- ❌ Do not imply active program launch or institutional affiliation

## When to Deploy

- ✅ Sandbox concept is governance-ready
- ✅ Content is conservative and boundary-clear
- ✅ Offline review confirms direction
- ⏳ Wait: wording may shift toward more human-first framing
- ⏳ Wait: Richard explicitly says "deploy"

**Deployed only when Richard explicitly instructs deployment.**
