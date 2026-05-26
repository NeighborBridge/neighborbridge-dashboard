# DEPLOYMENT PRIVACY NOTE

## Rule

**All private strategy dashboards must be deployed only to the intended internal/private dashboard environment. They must not be published to neighborbridgehealth.com or any public-facing route unless explicitly approved by Richard.**

## Canonical Deployment Targets

| Target | Purpose | Access | How |
|--------|---------|--------|-----|
| `neighborbridge-dashboard.richard272.workers.dev` | 🟢 **Internal/private dashboard** (canonical target) | Cloudflare Access / SSO — Richard's email in allow list | `git push origin main` → auto-deploy |
| `neighborbridgehealth.com` | 🔴 **Public website** — strategy dashboards prohibited | Public internet | Manual nginx config + route addition |
| Local file only | 🟢 Safe default for drafts | No external access | File on disk, no routing |

## Key Rules

1. **Dashboard updates should go through the active workspace repo** (`~/.openclaw/workspace/neighborbridge-dashboard/`) and deploy from `main` branch.
2. **neighborbridgehealth.com is the public website** and must remain separate from the internal dashboard.
3. **Private strategy dashboards must not be deployed to neighborbridgehealth.com or any public-facing route** unless Richard explicitly approves.
4. **If unsure, ask**: "Should this be internal/private dashboard only, or public website?"

## Current Status: Career / Field Contribution Dashboard

- ✅ Content created locally: `career-contribution.html`
- ❌ Not deployed anywhere (public or private)
- ✅ Public route (`/career-contribution`) removed from nginx
- ✅ No navigation links remain on neighborbridgehealth.com
- ⏳ **Not to be deployed** until Richard explicitly approves adding it to the Cloudflare internal dashboard

## History

| Date | Event |
|------|-------|
| 2026-04-11 | Cloudflare Worker deployment branch conflict introduced (two repos pushing to same remote) |
| 2026-05-01 | Career / Field Contribution dashboard mistakenly deployed to public neighborbridgehealth.com via nginx. Caught and reverted within minutes. Privacy governance rule established. |
| 2026-05-01 | Duplicate repo `/home/ubuntu/neighborbridge-dashboard/` removed. Only workspace repo remains. |
| 2026-05-01 | Confirmed: Cloudflare Worker was never broken — real root cause was wrong test URL (`cf.workers.dev` instead of `richard272.workers.dev`) + SSO login wall. |
| 2026-05-26 | Training Wheel Sandbox (`training-wheel/` dir) created. Isolated from main dashboard. Needs separate Cloudflare Pages project or Workers route (`training-wheel.richard272.workers.dev`). Not connected to main dashboard routing. |
