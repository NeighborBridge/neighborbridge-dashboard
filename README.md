# neighborbridge-dashboard

## Phase 1A — Email Dry Run (Email → Dashboard Pipeline)

### Overview
Read-only email classification for manually forwarded emails from key contacts. Classifies, flags risk, suggests dashboard destination, and saves draft replies locally. No outbound email, no dashboard writes, no PHI storage, no automatic Gmail forwarding.

### How It Works (Phase 1A)

```
Richard receives email from key contact
  → Richard manually reviews it (no sensitive/PHI content)
  → Richard forwards copy to dedicated inbox
  → Agent connects IMAP readonly, fetches unseen
  → Classifies, flags risk, saves draft .txt
  → Reports summary to Richard
  → Richard approves or modifies draft
  → (Phase 2: dashboard writes, not yet active)
```

**Key constraint**: Richard manually curates which emails enter the pipeline. No automatic forwarding rules. This ensures human review before any automated processing, even for whitelisted senders.

### Setup

1. **Create a dedicated Gmail** (e.g., `neighborbridge.inbox@gmail.com`) — this is the mailbox the Agent reads from
2. **Generate App Password** for the dedicated inbox:
   - Google Account → Security → 2-Step Verification → App Passwords
   - Select "Mail" → generate → copy the 16-character password
3. **Create `.env`** in this directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   nano .env   # fill in email + app password
   ```
4. **No Gmail forwarding rules needed for Phase 1A** — Richard manually forwards selected emails to the dedicated inbox

### Dry Run Command

```bash
cd neighborbridge-dashboard/
python3 email_dryrun.py
```

The script will:
- Connect IMAP readonly (does not mark emails as read)
- Fetch up to 10 unseen messages (forwarded by Richard)
- Classify each (contact, topic, risk, destination)
- Save draft replies to `drafts/` directory (`.gitignore`d)
- Print summary to stdout
- Save full JSON log to `drafts/`

### Whitelisted Contacts (Phase 1A)

Only these 6 senders trigger full processing:

| Contact | Domain | Dashboard Target |
|---|---|---|
| Melissa (Contentnea CEO) | contentnea.org | fqhc.html |
| Medical Director (Contentnea) | contentnea.org | fqhc.html |
| Amy (Proof Alliance NC) | proofalliancenc.org | fasd-care-pathway.html |
| Holly Warren (NC Public Health) | dhhs.nc.gov | chw-early-detection-sandbox.html |
| Cindy Ehlers (Trillium) | trilliumhealthresources.org | trillium.html |
| Vinod Srihari (Yale Psychiatry) | yale.edu | manuscript-dashboard.html |

All other senders are skipped entirely (regardless of subject keywords).

### Safety Guarantees

- **READONLY**: Never marks emails as read
- **MANUAL INTAKE**: Richard manually forwards emails → no automatic rules
- **NO WRITES**: Does not modify any dashboard HTML
- **NO OUTBOUND**: Does not send emails or create Gmail drafts
- **NO PHI**: High-risk patterns (PHI, pricing, contract, IP) trigger alert-only mode — draft skipped
- **NO CREDENTIALS IN REPO**: `.env` is excluded from git

### File Structure

```
neighborbridge-dashboard/
├── email_dryrun.py        # Main dry-run script
├── .env.example           # Template for credentials (copy to .env, never commit)
├── .env                   # Actual credentials (excluded from git)
├── drafts/                # Output: draft .txt files + JSON logs
│   ├── .gitignore         # Prevents drafts from being pushed
│   ├── 20260509-melissa-meeting.txt
│   └── email_dryrun_20260509-120000.json
└── README.md

---

## Compliance / External-Facing Risk Review

Before external-facing, payer-facing, referral-related, or institutionally sensitive material is sent or posted, run the Compliance / External-Facing Risk Reviewer.

See: `agents/COMPLIANCE_EXTERNAL_REVIEWER.md`
```
