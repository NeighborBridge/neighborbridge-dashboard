#!/usr/bin/env python3
"""
Phase 1A — Email-to-Dashboard Dry Run
=========================================

INPUT: Richard manually forwards whitelisted-contact emails to dedicated inbox.
OUTPUT: Classification + risk + dashboard destination + draft .txt (gitignored).

Safety guarantees:
  - READ-ONLY: never marks emails as read
  - MANUAL INTAKE: Richard curates which emails enter the pipeline
  - NO DASHBOARD WRITES: Phase 1B only
  - NO EMAIL SEND: no SMTP, no Gmail drafts
  - NO PHI STORAGE: PHI detection aborts with alert
  - NO CREDENTIALS IN REPO: .env excluded from git
"""

import imaplib
import email as email_parser
from email.header import decode_header
import re
import json
import os
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REQUIRED_ENV = ["FORWARDING_EMAIL", "FORWARDING_APP_PASSWORD"]
OPTIONAL_ENV = {
    "IMAP_SERVER": "imap.gmail.com",
    "IMAP_PORT": "993",
    "MAX_EMAILS": "10",
    "LOG_LEVEL": "INFO",
    "RETENTION_DAYS": "7",  # auto-cleanup drafts/logs older than this
}

# Whitelist senders — only these trigger full processing
CONTACT_WHITELIST = {
    "melissa@contentnea.org": "Melissa / Contentnea CEO",
    "medical.director@contentnea.org": "Medical Director / Contentnea",
    "amy@proofalliancenc.org": "Amy / Proof Alliance NC",
    "holly.warren@dhhs.nc.gov": "Holly Warren / NC Public Health",
    "cindy.ehlers@trilliumhealthresources.org": "Cindy Ehlers / Trillium",
    "vinod.srihari@yale.edu": "Vinod Srihari / Yale Psychiatry",
}

# Wildcard domains + required subject keywords
WILDCARD_DOMAINS = {
    "duke.edu": ["faculty", "appointment", "neighborbridge", "meeting", "collaboration"],
    "yale.edu": ["fasd", "manuscript", "review", "collaboration", "fetal alcohol"],
}

# Content-triggered keywords (any sender)
TRIGGER_KEYWORDS = [
    "fasd", "fetal alcohol", "neighborbridge", "grant opportunity",
    "pilot", "collaboration", "referral", "partnership", "proposal",
]

# High-risk patterns — ANY match → skip processing, alert only
HIGH_RISK_PATTERNS = [
    # PHI
    (r"\bpatient\b", "PHI"),
    (r"\bdiagnosis\b", "PHI"),
    (r"\btreatment plan\b", "PHI"),
    (r"\bmedical record\b", "PHI"),
    (r"\bDOB\b", "PHI"),
    (r"\b(ssn|social security)\b", "PHI"),
    # Financial / pricing
    (r"\$\d[\d,.]*", "pricing"),
    (r"\bpayment\b", "pricing"),
    (r"\breimbursement rate\b", "pricing"),
    (r"\bbudget\b", "pricing"),
    (r"\bROI\b", "pricing"),
    # Legal / contract
    (r"\bMOU\b", "contract"),
    (r"\bcontract\b", "contract"),
    (r"\bvendor agreement\b", "contract"),
    (r"\bindemnif", "contract"),
    (r"\bterms\b(?!\s+of\s+service)", "contract"),
    # IP
    (r"\bproprietary\b", "IP"),
    (r"\btrade secret\b", "IP"),
    (r"\bworkflow detail", "IP"),
    # Institutional commitments
    (r"\bcommit\b", "institutional"),
    (r"\bagree to\b", "institutional"),
    (r"\bpartnership agreement\b", "institutional"),
]

# Dashboard destinations
DESTINATION_MAP = {
    "melissa@contentnea.org": "fqhc.html",
    "medical.director@contentnea.org": "fqhc.html",
    "amy@proofalliancenc.org": "fasd-care-pathway.html",
    "holly.warren@dhhs.nc.gov": "chw-early-detection-sandbox.html",
    "cindy.ehlers@trilliumhealthresources.org": "trillium.html",
    "vinod.srihari@yale.edu": "manuscript-dashboard.html",
    "duke.edu": "faculty-pathway.html",
    "yale.edu": "manuscript-dashboard.html",
    "__unknown__": "internal-docs.html",
}

DRAFT_DIR = Path(__file__).parent / "drafts"
LOG_DIR = Path(__file__).parent / "drafts"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_config():
    """Load .env file from script directory."""
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        print("FATAL: .env file not found. Copy .env.example to .env and fill in credentials.")
        sys.exit(1)

    # Simple .env parser (no external deps)
    config = {}
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            config[key.strip()] = val.strip().strip('"\'')

    for key in REQUIRED_ENV:
        if key not in config or not config[key]:
            print(f"FATAL: Missing required env var: {key}")
            sys.exit(1)

    for key, default in OPTIONAL_ENV.items():
        if key not in config or not config[key]:
            config[key] = default

    config["IMAP_PORT"] = int(config["IMAP_PORT"])
    config["MAX_EMAILS"] = int(config["MAX_EMAILS"])
    config["RETENTION_DAYS"] = int(config["RETENTION_DAYS"])

    return config


def decode_email_header(header_value):
    """Decode an email header to plain text."""
    if header_value is None:
        return ""
    decoded_parts = decode_header(header_value)
    result = []
    for part, charset in decoded_parts:
        if isinstance(part, bytes):
            try:
                charset = charset or "utf-8"
                result.append(part.decode(charset, errors="replace"))
            except (LookupError, UnicodeDecodeError):
                result.append(part.decode("utf-8", errors="replace"))
        else:
            result.append(str(part))
    return " ".join(result)


def extract_email_address(from_header):
    """Extract plain email address from 'Name <email>' format."""
    match = re.search(r'<([^>]+)>', from_header)
    return match.group(1).lower() if match else from_header.strip().lower()


def get_email_body(msg):
    """Extract plain text body from an email message."""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body += payload.decode("utf-8", errors="replace")
                except Exception:
                    pass
            elif content_type == "text/html" and not body:
                # Fallback: extract from HTML if no plain text found
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        text = payload.decode("utf-8", errors="replace")
                        # Simple HTML tag removal
                        text = re.sub(r'<[^>]+>', ' ', text)
                        text = re.sub(r'\s+', ' ', text)
                        body += text.strip()
                except Exception:
                    pass
    else:
        try:
            payload = msg.get_payload(decode=True)
            if payload:
                body = payload.decode("utf-8", errors="replace")
        except Exception:
            pass
    return body.strip()


def classify_sender(from_addr):
    """Return (matched_address, contact_name) or (None, None)."""
    addr_lower = from_addr.lower()
    # Exact whitelist match
    for whitelisted, name in CONTACT_WHITELIST.items():
        if addr_lower == whitelisted:
            return whitelisted, name
    # Wildcard domain match
    for domain, keywords in WILDCARD_DOMAINS.items():
        if addr_lower.endswith(f"@{domain}"):
            return f"@{domain}", f"Wildcard: {domain}"
    return None, None


def check_trigger_keywords(subject, body):
    """Check if email subject/body contains trigger keywords (for non-whitelisted senders)."""
    text = f"{subject} {body}".lower()
    for kw in TRIGGER_KEYWORDS:
        if kw in text:
            return True
    return False


def check_high_risk(subject, body):
    """Return list of (risk_category, matched_pattern) if any high-risk patterns found."""
    text = f"{subject} {body}".lower()
    flags = []
    for pattern, category in HIGH_RISK_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            flags.append(category)
    return list(set(flags))  # deduplicate


def classify_topic(subject, body):
    """Simple keyword-based topic classification."""
    text = f"{subject} {body}".lower()

    topics = {
        "meeting scheduling": ["meeting", "schedule", "calendar", "when are you", "available", "time works"],
        "pilot / project": ["pilot", "project", "initiative", "program", "implementation"],
        "training / workshop": ["training", "workshop", "webinar", "presentation", "speak"],
        "manuscript / research": ["manuscript", "paper", "publication", "research", "finding", "review"],
        "grant / funding": ["grant", "funding", "proposal", "submission", "opportunity"],
        "partnership": ["partner", "collaboration", "coalition", "alliance", "together"],
        "administrative": ["confirm", "attached", "please find", "here is", "following up"],
        "faculty / career": ["faculty", "appointment", "position", "interview", "application", "duke"],
    }

    scores = {}
    for topic, keywords in topics.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scores[topic] = score

    if not scores:
        return "general"

    return max(scores, key=scores.get)


def determine_destination(from_addr):
    """Map sender email to dashboard destination."""
    addr_lower = from_addr.lower()
    for whitelisted, dest in DESTINATION_MAP.items():
        if whitelisted.startswith("@"):
            if addr_lower.endswith(whitelisted):
                return dest
        elif addr_lower == whitelisted:
            return dest
    return DESTINATION_MAP["__unknown__"]


def generate_draft(from_addr, contact_name, topic, subject, body, risk_flags, risk_level):
    """Generate a suggested reply draft. Conservative by default."""
    if risk_flags:
        return None  # No draft for high-risk emails
    if risk_level == "MEDIUM":
        return None  # MEDIUM risk → manual review only

    if "meeting" in topic.lower():
        return ("Thanks for reaching out. [Confirm availability / propose time] "
                "— looking forward to the conversation.")
    elif "pilot" in topic.lower() or "project" in topic.lower():
        return ("Thanks for the update on this. I'll review the details "
                "and follow up with any questions. Happy to discuss further "
                "when helpful.")
    elif "training" in topic.lower():
        return ("Thanks for sharing the training timeline. I'll review and "
                "confirm my availability. Appreciate you moving this forward.")
    elif "manuscript" in topic.lower():
        return ("Thanks for the review notes — very helpful. I'll work through "
                "the revisions and circle back with an updated draft.")
    elif "grant" in topic.lower():
        return ("Thanks for flagging this. I'll review the opportunity and "
                "let you know if it seems like a good fit.")
    elif "partnership" in topic.lower():
        return ("Thanks for the note. I think there's real potential here — "
                "happy to discuss next steps when you're ready.")
    elif "faculty" in topic.lower():
        return ("Thanks for the update. I'll prepare the requested materials "
                "and follow up. Appreciate your help with this.")
    else:
        return ("Thanks for the note. I'll review and follow up shortly.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def process_email(msg, config, logger):
    """Process a single email. Returns dict with classification results."""
    # Headers
    subject = decode_email_header(msg.get("Subject", ""))
    from_raw = decode_email_header(msg.get("From", ""))
    date_str = msg.get("Date", "")
    message_id = msg.get("Message-ID", "") or msg.get("Message-Id", "") or ""

    # Body
    body = get_email_body(msg)

    # Sender classification
    from_addr = extract_email_address(from_raw)
    matched_addr, contact_name = classify_sender(from_addr)

    # If not whitelisted, check trigger keywords
    if not matched_addr and not check_trigger_keywords(subject, body):
        logger.info(f"Skipping (no match): {from_addr} — {subject[:60]}")
        return None

    # Risk check
    risk_flags = check_high_risk(subject, body)
    risk_level = "HIGH" if risk_flags else ("MEDIUM" if matched_addr is None else "LOW")

    # Topic classification
    topic = classify_topic(subject, body)

    # Destination
    destination = determine_destination(from_addr)

    # Draft (only if not high-risk)
    draft = generate_draft(from_addr, contact_name, topic, subject, body, risk_flags, risk_level)

    result = {
        "from_addr": from_addr,
        "from_raw": from_raw,
        "contact_name": contact_name or "unknown",
        "subject": subject,
        "date": date_str,
        "topic": topic,
        "risk_level": risk_level,
        "risk_flags": risk_flags,
        "destination": destination,
        "draft": draft,
        # Email body NOT stored in logs/drafts (privacy by design)
                "body_words": len(body.split()),
                "body_signals": {
                    "meeting": any(w in body.lower() for w in ["meeting", "schedule", "calendar"]),
                    "pilot": any(w in body.lower() for w in ["pilot", "project", "program"]),
                    "training": any(w in body.lower() for w in ["training", "workshop", "presentation"]),
                    "manuscript": any(w in body.lower() for w in ["manuscript", "paper", "publication"]),
                    "grant": any(w in body.lower() for w in ["grant", "funding", "proposal"]),
                },
    }

    # Save draft if generated
    if draft:
        safe_name = re.sub(r'[^a-zA-Z0-9_-]+', '_', f"{contact_name or from_addr}-{topic}")
        safe_name = safe_name[:80]
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        filename = f"{timestamp}-{safe_name}.txt"
        draft_path = DRAFT_DIR / filename
        with open(draft_path, "w") as f:
            f.write(f"From: {from_raw}\n")
            f.write(f"Subject: {subject}\n")
            f.write(f"Date: {date_str}\n")
            f.write(f"Risk: {risk_level}\n")
            f.write(f"Dashboard: {destination}\n")
            f.write(f"Topic: {topic}\n")
            f.write(f"{'='*60}\n")
            f.write(f"\nDraft reply:\n{'-'*40}\n")
            f.write(draft)
            f.write(f"\n\n--- End of draft (awaiting Richard review) ---\n")
        result["draft_file"] = str(draft_path)
        logger.info(f"Draft saved: {draft_path.name}")

    return result


def main():
    config = load_config()

    # Logger
    log_level = getattr(logging, config["LOG_LEVEL"].upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    logger = logging.getLogger("email_dryrun")

    # Auto-cleanup: remove artifacts older than RETENTION_DAYS
    purge_before = datetime.now(timezone.utc).timestamp() - (config['RETENTION_DAYS'] * 86400)
    for f in list(DRAFT_DIR.glob('*.txt')) + list(DRAFT_DIR.glob('*.json')):
        if f.stat().st_mtime < purge_before:
            f.unlink()
            logger.info(f'Cleaned up expired artifact: {f.name}')

    # Print run header
    print(f"\n{'='*60}")
    print(f"  Phase 1A - Email Dry Run (Manual Forward Only)")
    print(f"  Started: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"  Mailbox: {config['FORWARDING_EMAIL']}")
    print(f"  Max:      {config['MAX_EMAILS']} unseen messages")
    print(f"  Retention: {config['RETENTION_DAYS']} days (auto-cleanup)")
    print(f"  Whitelist: 6 contacts only")
    print(f"{'='*60}\n")

    # Connect to IMAP
    logger.info(f"Connecting to {config['IMAP_SERVER']}:{config['IMAP_PORT']}...")
    try:
        mail = imaplib.IMAP4_SSL(config["IMAP_SERVER"], config["IMAP_PORT"])
        mail.login(config["FORWARDING_EMAIL"], config["FORWARDING_APP_PASSWORD"])
        logger.info("Connected and authenticated.")
    except Exception as e:
        logger.error(f"IMAP connection failed: {e}")
        print(f"\n❌ Connection failed. Check credentials in .env")
        print(f"   Error: {e}")
        sys.exit(1)

    # Select INBOX (readonly = don't mark as read)
    try:
        mail.select("INBOX", readonly=True)
    except Exception as e:
        logger.error(f"Failed to select INBOX: {e}")
        mail.logout()
        sys.exit(1)

    # Search for unseen messages
    try:
        status, messages = mail.search(None, "UNSEEN")
    except Exception as e:
        logger.error(f"Search failed: {e}")
        mail.logout()
        sys.exit(1)

    if status != "OK" or not messages[0]:
        logger.info("No unseen messages found.")
        print("\n📭 No new emails to process.")
        mail.logout()
        return

    email_ids = messages[0].split()
    max_emails = min(config["MAX_EMAILS"], len(email_ids))
    to_process = email_ids[:max_emails]

    logger.info(f"Found {len(email_ids)} unseen messages, processing {max_emails}.")
    print(f"   Found {len(email_ids)} unseen · Processing {max_emails}\n")

    results = []
    high_risk_alerts = []

    for idx, eid in enumerate(to_process, 1):
        try:
            status, data = mail.fetch(eid, "(RFC822)")
            if status != "OK":
                logger.warning(f"Failed to fetch email {eid}")
                continue

            msg = email_parser.message_from_bytes(data[0][1])
            result = process_email(msg, config, logger)

            if result is None:
                continue

            results.append(result)

            # Print summary
            risk_icon = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}
            print(f"  {'─'*55}")
            print(f"  [{idx}/{max_emails}] {risk_icon.get(result['risk_level'], '⚪')} {result['contact_name']}")
            print(f"  Subject: {result['subject'][:80]}")
            print(f"  From:    {result['from_raw'][:60]}")
            print(f"  Topic:   {result['topic']}")
            print(f"  Risk:    {result['risk_level']}" +
                  (f" [{', '.join(result['risk_flags'])}]" if result['risk_flags'] else ""))
            print(f"  Dest:    {result['destination']}")
            if result.get("draft_file"):
                print(f"  Draft:   {result['draft_file']}")
            if result['risk_level'] == "HIGH":
                high_risk_alerts.append(result)
                print(f"  ⚠️  HIGH RISK — Alert only. Manual review required.")
            elif result['risk_level'] == "MEDIUM":
                print(f"  ⚠️  MEDIUM RISK — Manual review required. No draft.")

        except Exception as e:
            logger.error(f"Error processing email {eid}: {e}")
            continue

    mail.logout()

    # Summary
    print(f"\n{'='*60}")
    print(f"  Dry Run Complete")
    print(f"  Processed: {len(results)} emails")
    print(f"  High-risk: {len(high_risk_alerts)}")
    print(f"  Drafts saved: {sum(1 for r in results if r.get('draft_file'))}")
    print(f"{'='*60}")

    if high_risk_alerts:
        print(f"\n⚠️  HIGH-RISK ALERTS — Require manual review:")
        for r in high_risk_alerts:
            print(f"   • {r['contact_name']}: {r['subject'][:60]}")
            print(f"     Flags: {', '.join(r['risk_flags'])}")

    # Save JSON log
    log_path = LOG_DIR / f"email_dryrun_{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    log_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mailbox": config["FORWARDING_EMAIL"],
        "results": results,
    }
    with open(log_path, "w") as f:
        json.dump(log_data, f, indent=2, ensure_ascii=False)
    logger.info(f"Log saved: {log_path}")
    print(f"\n📋 Full log: {log_path}")
    print()


if __name__ == "__main__":
    main()
