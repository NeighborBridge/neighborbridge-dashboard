# P2 Render Spec — Booklet Rendering Pipeline

## File Structure

| File | Purpose |
|---|---|
| `p2-booklet-template.html` | Canonical HTML template (golden master). Contains all CSS + page structure. |
| `p2-booklet-template.css` | NOT used. All styles are inline in the template to keep a single-file canonical source. |
| `memory/p2-golden-master-rendering-lock.md` | Golden master designation record + rendering rules. |

## Rendering Pipeline

```
Step 1: Content preparation
  - Start from p2-booklet-template.html
  - Insert or modify content divs only
  - Never change CSS or page structure

Step 2: Generate PDF
  Command: npx playwright pdf "file://$PWD/p2-booklet-template.html" "output.pdf"

Step 3: Generate preview PNG
  Command: npx playwright screenshot --full-page "file://$PWD/p2-booklet-template.html" "output-cover.png"

Step 4: QA check
  Run against golden master QA checklist (see lock file)
  If render is visually weaker → mark as failed, revert template, fix pipeline
```

## Content Insertion Points

| Insert Here | What | Example |
|---|---|---|
| After TOC `<ol>` in cover | New TOC items | `<li>Appendix — Tool A1: Caregiver Observation Log</li>` |
| Before or after existing content pages | New content pages | Copy `<div class="page">...</div>` block, fill content |
| After final `<div class="page">` | Appendix pages | Add `<div class="page">` with appendix-header + appendix-body |

## Page Structure (Copy Pattern)

```
<div class="page">
<div class="content-header">
  <span class="page-num">Page X of 10</span>
  <h2>Page Title</h2>
  <span class="internal-tag">Internal Draft</span>
</div>
<div class="content-grid">
  <div class="purpose">...</div>
  <h3>Section Title</h3>
  <ul>...</ul>
</div>
<div class="boundary-box">
  <strong>⚠ Boundary</strong>
  <p>Boundary text here.</p>
</div>
<div class="emergency-strip">...</div>
<div class="source-section">...</div>
<div class="page-footer">...</div>
</div>
```

## Appendix Page Structure

```
<div class="page">
<div class="appendix-header">
  <h2>Appendix Title</h2>
  <span class="internal-tag">Internal Draft</span>
</div>
<div class="appendix-body">
  <p>Content here with tags, status badges, boundary boxes.</p>
  <div class="source-item">...</div>
</div>
<div class="page-footer">...</div>
</div>
```

## Design System Summary

| Element | CSS Class | Visual |
|---|---|---|
| Cover | `.cover-panel` | Teal gradient (#0F766E → #115E59) |
| Content header | `.content-header` | Solid teal (#0F766E) |
| Appendix header | `.appendix-header` | Gray (#4B5563) |
| Boundary box | `.boundary-box` | Red left border, #FEF2F2 bg |
| Emergency strip | `.emergency-strip` | Blue border, #EFF6FF bg |
| Source section | `.source-section` | Gray top border, #F9FAFB bg |
| Footer | `.page-footer` | Absolute bottom, 6.5pt, gray |

## Version History Under Golden Master

| Date | Version | Content | File |
|---|---|---|---|
| 2026-05-22 | Original GM | 10 core pages + appendix | `p2-behavior-toolkit-booklet-prototype.pdf` |
| 2026-05-23 | GM + A1 | Above + Tool A1 appendix | `p2-booklet-template.html` (re-render needed) |
