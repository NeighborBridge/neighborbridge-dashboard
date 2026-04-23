# NeighborBridge Structured Data Schema (Phase 1)

## Overview

Machine-readable structured data embedded in HTML files to enable AI-agent automation. The data lives in `<script type="application/json">` blocks — invisible to the browser, machine-parseable by agents.

## Location

| Object | File | Script ID |
|---|---|---|
| Stakeholders | `stakeholders.html` | `#nb-stakeholders` |
| Tasks | `index.html` | `#nb-tasks` |

## Objects Migrated (Phase 1)

- **Stakeholders**: Vinod Srihari (YALE-PSYCH-001), Dr. Holly Warren (NC-FASD-001)
- **Tasks**: Task 1 (联系Vinod), Task 2 (Medical Director沟通), Task 3 (FASD护理路径)

## Schema

### Stakeholder

```json
{
  "type": "stakeholder",
  "id": "string — stable unique ID",
  "name": "string — English name",
  "display_name_cn": "string — display name",
  "priority": "high | medium | low",
  "status": "new | warm | active | awaiting_followup | waiting_response | strategic_ally | dormant",
  "relationship_type": "academic_calibrator | local_champion | payer | partner | advisor | other",
  "trust_level": "high | medium | low",
  "influence_level": "high | medium | low",
  "funding_relevance": "boolean",
  "panel_relevance": "boolean",
  "last_contact_date": "YYYY-MM-DD",
  "next_action": "string — what to do next",
  "next_action_due": "YYYY-MM-DD",
  "agent_execution_level": "manual_only | draft_only | draft_with_review | execute_with_review | auto_execute",
  "external_doc_url": "string — Google Docs or empty",
  "brief_summary_cn": "string — one-line Chinese summary",
  "updated_at": "YYYY-MM-DD"
}
```

### Task

```json
{
  "type": "task",
  "id": "number — unique ID",
  "title_cn": "string — Chinese title",
  "priority": "high | medium | low",
  "status": "not_started | in_progress | ready_for_review | blocked | done",
  "owner": "string",
  "due_date": "YYYY-MM-DD",
  "can_agent_execute": "boolean",
  "requires_user_approval": "boolean",
  "next_action": "string — actionable next step",
  "success_definition_cn": "string — Chinese success criteria",
  "linked_stakeholder_id": "string — stakeholder ID or empty",
  "updated_at": "YYYY-MM-DD"
}
```

## Status Vocabulary

### Stakeholder statuses
- `new` — initial contact, no meaningful interaction yet
- `warm` — positive initial contact, pending calibration
- `active` — regular engagement
- `awaiting_followup` — need to initiate next contact
- `waiting_response` — waiting for them to reply
- `strategic_ally` — trusted, aligned, high-value relationship
- `dormant` — inactive, no current need

### Task statuses
- `not_started` — pending
- `in_progress` — actively working
- `ready_for_review` — completed, needs user review
- `blocked` — cannot proceed without external unblock
- `done` — completed

## Agent Execution Levels

- `manual_only` — agent should not touch this
- `draft_only` — agent may draft content but not send it
- `draft_with_review` — agent drafts, user reviews before sending
- `execute_with_review` — agent may execute action, user reviews first
- `auto_execute` — agent may execute without review

## Extending the Schema

To migrate a new object type (e.g. blockers, connections, sub-dashboards):

1. Add a `<script type="application/json" id="nb-{type}">` block to the appropriate HTML file
2. Use the field naming conventions above (snake_case, English)
3. Add a note in this file documenting the new type
4. No UI changes needed

For new fields, prefer backward-compatible additions (optional fields with defaults). Do not remove fields once published.

## UI → Schema Status Mapping

| UI display | Schema value |
|---|---|
| 未开始 | not_started |
| 进行中 | in_progress |
| 已完成 | done |
| 高价值 / 高优先级 | high |
| 中优先级 | medium |
| 通话后跟进 | awaiting_followup |
| 高信任关系 / 本地关键盟友 | strategic_ally |
