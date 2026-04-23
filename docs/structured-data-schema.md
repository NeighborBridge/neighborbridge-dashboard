# NeighborBridge Structured Data Schema (Phase 1–2)

## Overview

Machine-readable structured data embedded in HTML files to enable AI-agent automation. The data lives in `<script type="application/json">` blocks — invisible to the browser, machine-parseable by agents.

`#nb-dashboard-meta` is the root-level entry point. Future agents should read this block FIRST to understand the page context before inspecting other blocks.

## Location

| Object | File | Script ID |
|---|---|---|
| Dashboard Meta | `index.html` | `#nb-dashboard-meta` |
| Stakeholders | `stakeholders.html` | `#nb-stakeholders` |
| Tasks | `index.html` | `#nb-tasks` |
| Connections | `index.html` | `#nb-connections` |
| Blockers | `index.html` | `#nb-blockers` |
| Actions | `index.html` | `#nb-actions` |

## Objects Migrated (Phase 1–2)

- **Dashboard Meta**: Page-level metadata for NeighborBridge Main Dashboard (`#nb-dashboard-meta`)
- **Stakeholders**: Vinod Srihari (YALE-PSYCH-001), Dr. Holly Warren (NC-FASD-001)
- **Tasks**: Task 1 (联系Vinod), Task 2 (Medical Director沟通), Task 3 (FASD护理路径)
- **Connections**: FQHC↔Trillium (CONN-001), Vinod Srihari↔当前需求 (CONN-002), Medical Director↔风险对齐 (CONN-003)
- **Blockers**: FQHC Medical Director未对齐 (BLKR-001), Trillium试点入口缺失 (BLKR-002), 学术-商业整合延迟 (BLKR-003)
- **Actions**: 发送Medical Director消息 (ACT-001), 联系Vinod Srihari (ACT-002), 更新Trillium优先级 (ACT-003), 审查阻塞项 (ACT-004)

## Schema

### Dashboard Meta (Root-Level Entry Point)

```json
{
  "type": "dashboard_metadata",
  "page_id": "string — stable page identifier",
  "page_name": "string — English page name",
  "page_name_cn": "string — Chinese page name",
  "dashboard_role_cn": "string — purpose description in Chinese",
  "is_main_dashboard": "boolean",
  "version": "string — semver",
  "last_updated": "YYYY-MM-DD",
  "structured_object_types": ["string — list of object types present"],
  "structured_block_ids": ["string — list of #nb- IDs present"],
  "bootstrap_read_order": ["string — ordered list of #nb- IDs for agent onboarding"],
  "page_priority": "high | medium | low",
  "default_language": "string — e.g. zh-CN",
  "mobile_first": "boolean",
  "auto_push_default": "boolean",
  "requires_user_approval_for_live_changes": "boolean",
  "brief_summary_cn": "string — one-line Chinese summary",
  "status_counts": {
    "stakeholder_count": "number",
    "task_count": "number",
    "connection_count": "number",
    "blocker_count": "number",
    "action_count": "number"
  },
  "priority_snapshot": {
    "high_priority_count": "number",
    "medium_priority_count": "number",
    "low_priority_count": "number"
  },
  "section_presence": {
    "has_actions": "boolean",
    "has_status_overview": "boolean",
    "has_connections": "boolean",
    "has_blockers": "boolean",
    "has_tasks": "boolean"
  },
  "agent_behavior_flags": {
    "use_workspace_recovery_first": "boolean",
    "auto_push_after_verified_dashboard_edits": "boolean",
    "keep_ui_compact": "boolean",
    "chinese_first_visible_content": "boolean"
  },
  "recommended_agent_start_point": "string — guidance for agents reading this page",
  "recommended_next_structured_object_type": "string — suggestion for future migration",
  "auto_push_rule": "string — full rule description",
  "notes_for_agents": ["string — array of operational notes"]
}
```

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

### Connection

```json
{
  "type": "connection",
  "id": "string — stable unique ID",
  "title_cn": "string — Chinese display title",
  "left_entity": "string — left side of connection",
  "right_entity": "string — right side of connection",
  "connection_type": "pilot_opportunity | academic_backing | risk_boundary | partnership | other",
  "priority": "high | medium | low",
  "status": "active | monitoring | pending | resolved",
  "brief_summary_cn": "string — one-line Chinese summary",
  "why_it_matters_cn": "string — paragraph explaining strategic importance",
  "next_action": "string — actionable next step",
  "next_action_due": "YYYY-MM-DD",
  "related_stakeholders": ["string — stakeholder IDs"],
  "related_dashboards": ["string — dashboard paths"],
  "agent_execution_level": "manual_only | draft_only | draft_with_review | execute_with_review | auto_execute",
  "updated_at": "YYYY-MM-DD"
}
```

### Blocker

```json
{
  "type": "blocker",
  "id": "string — stable unique ID",
  "title_cn": "string — Chinese title",
  "priority": "high | medium | low",
  "status": "active | monitoring | resolved",
  "impact_level": "high | medium | low",
  "brief_summary_cn": "string — one-line Chinese summary",
  "owner": "string",
  "next_action": "string — actionable next step",
  "next_action_due": "YYYY-MM-DD",
  "related_stakeholders": ["string — stakeholder IDs"],
  "related_dashboards": ["string — dashboard paths"],
  "agent_execution_level": "manual_only | draft_only | draft_with_review | execute_with_review | auto_execute",
  "resolved_condition_cn": "string — what 'done' looks like in Chinese",
  "updated_at": "YYYY-MM-DD"
}
```

The blockers block also includes a top-level `dashboard_summary` object:

```json
{
  "dashboard_summary": {
    "impact_cn": "string — bottom-line impact sentence",
    "total_active": "number",
    "highest_impact_blocker_id": "string",
    "updated_at": "YYYY-MM-DD"
  }
}
```

### Action

```json
{
  "type": "action",
  "id": "string — stable unique ID",
  "title_cn": "string — Chinese title",
  "priority": "high | medium | low",
  "status": "not_started | in_progress | ready_for_review | blocked | done",
  "owner": "string",
  "linked_dashboard": "string — dashboard path",
  "related_stakeholders": ["string — stakeholder IDs"],
  "brief_summary_cn": "string — one-line Chinese summary",
  "next_step_cn": "string — next actionable step in Chinese",
  "can_agent_execute": "boolean",
  "requires_user_approval": "boolean",
  "agent_execution_level": "manual_only | draft_only | draft_with_review | execute_with_review | auto_execute",
  "completion_state": "pending | done",
  "due_date": "YYYY-MM-DD",
  "trigger_source": "string — what triggers this action",
  "success_definition_cn": "string — Chinese success criteria",
  "updated_at": "YYYY-MM-DD"
}
```

Each `#nb-actions` block also includes a top-level `summary` object:

```json
{
  "summary": {
    "section_title_cn": "string",
    "total_actions": "number",
    "completed_actions": "number",
    "pending_actions": "number",
    "last_updated": "YYYY-MM-DD",
    "section_status": "pending | partial | done"
  },
  "actions": [ ... ]
}
```

## Agent Bootstrap Process

When reading a NeighborBridge dashboard page for the first time:

1. **Read `#nb-dashboard-meta` first** — this block tells you:
   - What page you're on
   - What structured object types exist
   - The recommended reading order (`bootstrap_read_order`)
   - Key operational policies (auto-push, language, mobile-first)
   - Agent behavior flags for editing conventions

2. **Follow `bootstrap_read_order`** — each subsequent block builds on the previous one:
   - `#nb-actions`: Today's executable actions and completion status
   - `#nb-blockers`: Current blockers blocking progress
   - `#nb-connections`: Strategic relationships and dependencies
   - `#nb-tasks`: Active tasks with execution levels
   - `#nb-stakeholders`: Key stakeholder profiles and engagement states

3. **Schema documentation** at `docs/structured-data-schema.md` — reference for field definitions, status vocabularies, and agent execution levels.

4. **Editing conventions**:
   - Always verify JSON validity after editing any structured block
   - Keep visible UI unchanged unless explicitly requested
   - Update schema docs when adding new object types
   - Don't remove fields once published (backward-compatible additions only)
   - Auto-push to GitHub main by default unless Richard says not to deploy yet

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

To migrate a new object type (e.g. sub-dashboards, metrics, KPIs):

1. Add a `<script type="application/json" id="nb-{type}">` block to the appropriate HTML file
2. Use the field naming conventions above (snake_case, English)
3. Add a note in this file documenting the new type
4. Update `#nb-dashboard-meta` if present — add the new type to `structured_object_types`, `structured_block_ids`, and update `status_counts` or `section_presence`
5. No UI changes needed

For new fields, prefer backward-compatible additions (optional fields with defaults). Do not remove fields once published.

### Adding a new Main Dashboard page

If creating a new sub-dashboard page (not the Main Dashboard index.html), create its own `#nb-dashboard-meta` block with relevant `page_id`, `page_name`, `dashboard_role_cn`, and `structured_object_types` describing what structured data it contains.

## Bootstrap Read Order Reference

The canonical `bootstrap_read_order` from `#nb-dashboard-meta`:

```
1. #nb-dashboard-meta   — page-level summary and entry point
2. #nb-actions          — today's executable actions
3. #nb-blockers         — current blockers
4. #nb-connections      — strategic relationship dependencies
5. #nb-tasks            — operational task tracking
6. #nb-stakeholders     — stakeholder profiles (separate file: stakeholders.html)
```

This order is also embedded in the `bootstrap_read_order` array within each `#nb-dashboard-meta` block. Agents should follow this order when bootstrapping on a page.

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

### Connection statuses
- `active` — actively leveraged or being developed
- `monitoring` — exists, no immediate action needed
- `pending` — identified but not yet activated
- `resolved` — connection has achieved its purpose

### Blocker statuses
- `active` — currently blocking progress
- `monitoring` — exists but not actively blocking yet
- `resolved` — blocker has been addressed

### Action statuses
- `not_started` — pending, not yet begun
- `in_progress` — actively being worked on
- `ready_for_review` — completed, needs user review
- `blocked` — cannot proceed
- `done` — completed

### Action section_status values
- `pending` — no actions completed yet
- `partial` — some actions completed
- `done` — all actions completed

## UI → Schema Status Mapping (Blockers)

| UI display | Schema value |
|---|---|
| 未对齐 / 缺失 / 延迟 | active |
| 影响句 | dashboard_summary.impact_cn |
