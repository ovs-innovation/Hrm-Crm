# Chapter 4 — Kanban Pipeline Board (Primary UX)

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 4  
**Version:** 1.0.0-draft

---

## 4.1 Purpose

The **Pipeline Board** is the signature CRM screen — where sales teams spend 60%+ of their time. UX target: **Zoho-level information density** with **Vastora premium polish** (spacing, motion, typography).

**Route:** `/crm/deals/board`  
**Permission:** `crm:deal:read` / `read_all`

---

## 4.2 Full Desktop Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (64px) — Search ⌘K │ 🔔 │ User                                                    │
├──────────┬───────────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR  │ Deals — Enterprise Pipeline          [Board ●] [List] [Chart]   [+ New Deal]  │
│ (navy)   ├───────────────────────────────────────────────────────────────────────────────┤
│          │ [Pipeline: Enterprise ▾] [Owner: All ▾] [Close: This month ▾] [More filters ▾]  │
│          │ Active filters: Owner: Amit ×  │  Clear all                                     │
│          ├───────────────────────────────────────────────────────────────────────────────┤
│          │ ┌─ Qualification ────┐ ┌─ Needs Analysis ───┐ ┌─ Proposal ─────────┐ ┌─ ...   │
│          │ │ 4 deals · ₹12.4L   │ │ 3 deals · ₹8.2L    │ │ 2 deals · ₹15L    │         │
│          │ ├────────────────────┤ ├────────────────────┤ ├───────────────────┤         │
│          │ │┌──────────────────┐│ │┌──────────────────┐│ │┌─────────────────┐│         │
│          │ ││ Acme Enterprise  ││ ││ TechStart MVP    ││ ││ GlobalRetail    ││         │
│          │ ││ ABC Pvt Ltd      ││ ││ TechStart Inc    ││ ││ GlobalRetail Ltd││         │
│          │ ││ ₹8,50,000        ││ ││ ₹3,20,000        ││ ││ ₹12,00,000      ││         │
│          │ ││ Close: Aug 15    ││ ││ Close: Jul 28 ⚠  ││ ││ Close: Sep 1    ││         │
│          │ ││ [AM] Amit        ││ ││ [PR] Priya       ││ ││ [AM] Amit       ││         │
│          │ │└──────────────────┘│ │└──────────────────┘│ │└─────────────────┘│         │
│          │ │┌──────────────────┐│ │                    │ │                 │         │
│          │ ││ Nova Health      ││ │  + Add Deal        │ │  + Add Deal     │         │
│          │ ││ ...              ││ │                    │ │                 │         │
│          │ │└──────────────────┘│ │                    │ │                 │         │
│          │ │  + Add Deal        │ │                    │ │                 │         │
│          │ └────────────────────┘ └────────────────────┘ └───────────────────┘         │
│          │ ◂ scroll ──────────────────────────────────────────────────────────── ▸      │
│          ├───────────────────────────────────────────────────────────────────────────────┤
│          │ FOOTER SUMMARY: 18 open deals · ₹42.5L pipeline · ₹18.2L weighted forecast    │
└──────────┴───────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.3 Vastora vs Zoho — Visual Spec

| Element | Zoho (Don't copy) | Vastora Spec |
|---------|-------------------|--------------|
| Page background | Light gray | `#F8FBFF` canvas |
| Column header | Bold blue bar | White card header, `border-b-2 border-brand` accent |
| Deal card | White, sharp shadow | White, `rounded-xl` (12px), `shadow-sm`, hover `shadow-md` |
| Amount font | Standard | **IBM Plex Sans**, 16px semibold |
| Stage count badge | Blue pill | `bg-brand-xlight text-brand` pill |
| Overdue date | Red text | `text-danger` + ⚠ icon |
| Sidebar | Light collapsible | **Navy `#273850`** — fixed Vastora chrome |
| Primary button | Zoho blue | `#296CB2` with `rounded-xl` |
| Drag ghost | Blue tint | `ring-2 ring-brand/40 scale-[1.02]` |
| Column width | ~280px | **300px** fixed; min-height fill viewport |

---

## 4.4 Deal Card Anatomy

```
┌─────────────────────────────────────┐  ← 300px wide, padding 12px
│ ● Acme Enterprise License           │  ← title: 14px semibold, 2-line clamp
│   ABC Pvt Ltd                       │  ← company: 13px muted, 1-line
│                                     │
│   ₹8,50,000                         │  ← IBM Plex Sans, brand-dark
│                                     │
│   📅 Aug 15, 2026                   │  ← 12px; red if overdue
│   ┌────┐                            │
│   │ AM │ Amit Sharma                │  ← avatar 24px + name 12px
│   └────┘                            │
│   [Quote sent]                      │  ← optional status chip
└─────────────────────────────────────┘
```

### Card Interactions

| Action | Behavior |
|--------|----------|
| Click card | Navigate to Deal 360 |
| Drag card | Move to another column → stage change API |
| Hover | `shadow-md`, subtle lift `translateY(-1px)` |
| Right-click | Context menu: Edit, Log activity, Mark won/lost `[P1]` |
| Overdue close date | Left border `3px solid #EF4444` |

---

## 4.5 Column Header

```
┌─────────────────────────────────────┐
│ Proposal              2  │ ₹15.0L  │
│ ████████░░ 40% prob                 │  ← probability bar (optional)
└─────────────────────────────────────┘
```

- **Title:** stage name, 14px semibold
- **Count + sum:** 12px muted; sum uses compact Indian notation (₹8.5L)
- **Color strip:** 3px top border using `stage.color` (tenant configurable)

---

## 4.6 Toolbar & View Switcher

| Control | Spec |
|---------|------|
| View toggle | Segmented control: **Board** \| List \| Chart `[P1]` |
| Pipeline select | Dropdown if tenant has multiple pipelines |
| + New Deal | Primary button → modal with stage pre-filled from column |
| Filters | Sticky below toolbar; collapses on scroll `[P1]` |
| Sort within column | Close date (default), Amount, Last activity `[P1]` |

---

## 4.7 Filter Bar (Zoho-Dense)

| Filter | Type |
|--------|------|
| Pipeline | Single select |
| Owner | User multi-select + Me |
| Expected close | This week / month / quarter / custom |
| Amount range | Min–max |
| Stage | Multi-select (list view primarily) |
| Company | Autocomplete |
| Created date | Range |

Active filters as removable chips (Notion-style clarity on dense bar).

---

## 4.8 Drag-and-Drop UX

```
User grabs card → card lifts (scale 1.02, shadow-lg)
  → Valid column highlights (brand-xlight bg)
  → Invalid column (closed/won) shows no-drop cursor
  → Drop → Optimistic UI move
  → PATCH /deals/:id { stage_id }
  → Success: toast "Moved to Proposal"
  → Fail: revert card + error toast
  → Timeline: "Stage changed Qualification → Proposal"
  → Audit: deal.stage_changed
```

**Animation:** Framer Motion 200ms `ease-out`. No bounce.

### Stage Gate Rules

If moving to **Proposal** requires amount > 0:

```
Drop blocked → modal "Add deal amount before moving to Proposal"
  → Inline amount field → Save & move
```

Configurable per stage in pipeline settings (Chapter 2).

---

## 4.9 Quick Create from Column

```
Click "+ Add Deal" at column bottom
  → Slide-up drawer (480px) OR modal
  → Fields: Title*, Company*, Contact*, Amount, Close date
  → Stage locked to column stage
  → Owner defaults to current user
  → Save → card appears at top of column
```

---

## 4.10 Footer Summary Bar

Fixed at bottom of board (desktop):

| Metric | Formula |
|--------|---------|
| Open deals | Count non-closed stages |
| Pipeline value | Sum amounts |
| Weighted forecast | Sum `amount × probability/100` |

Click metric → opens forecast report (Chapter 7).

---

## 4.11 API — Board Data

**GET** `/api/v1/crm/deals/board?pipeline_id=&owner_id=&close_period=`

```json
{
  "pipeline": { "id": "uuid", "name": "Enterprise" },
  "stages": [
    {
      "id": "uuid",
      "name": "Qualification",
      "color": "#296CB2",
      "probability": 20,
      "deal_count": 4,
      "total_amount": 1240000,
      "deals": [
        {
          "id": "uuid",
          "title": "Acme Enterprise License",
          "amount": 850000,
          "currency": "INR",
          "expected_close_date": "2026-08-15",
          "is_overdue": false,
          "owner": { "id": "uuid", "name": "Amit", "avatar_url": null },
          "company": { "id": "uuid", "name": "ABC Pvt Ltd" },
          "primary_contact": { "id": "uuid", "name": "John Smith" },
          "badges": ["quote_sent"]
        }
      ]
    }
  ],
  "summary": {
    "open_count": 18,
    "pipeline_value": 4250000,
    "weighted_forecast": 1820000
  }
}
```

---

## 4.12 Tenant Scope

Board API returns only deals where `tenant_id = auth.tenant_id`. sales_rep without read_all sees own deals only.

---

## 4.13 Permissions

| Action | Permission |
|--------|------------|
| View board | `crm:deal:read` |
| Drag stage change | `crm:deal:update` on own deal |
| Create from column | `crm:deal:create` |
| View all reps' deals | `crm:deal:read_all` |

---

## 4.14 Audit Log

Every drag-drop stage change → `deal.stage_changed` with `{ from_stage_id, to_stage_id, method: "kanban" }`.

---

## 4.15 Responsive

| Breakpoint | UX |
|------------|-----|
| **Desktop** (>1280px) | Full Kanban, 4–5 columns visible, horizontal scroll |
| **Tablet** (768–1280px) | Kanban with 2–3 columns visible; cards slightly compact (hide contact name) |
| **Mobile** (<768px) | **Accordion by stage** — tap stage to expand deal cards; no drag (use "Move to…" action sheet) |

### Mobile Stage Accordion

```
▼ Proposal (2) · ₹15.0L
    Acme Enterprise — ₹8.5L — Aug 15
    GlobalRetail — ₹6.5L — Sep 1
    [+ Add Deal]
▶ Negotiation (1) · ₹5.0L
```

Swipe left on card → quick actions (Call, Move stage, View).

---

## 4.16 Empty States

| State | UI |
|-------|-----|
| No deals in pipeline | Center illustration + "Create your first deal" + CTA |
| Empty column | Dashed border "+ Add Deal" placeholder card |
| Filter no match | "No deals match filters" + Clear |

---

## 4.17 Loading State

Skeleton: 5 columns × 3 skeleton cards each; shimmer animation. Never blank board.

---

## 4.18 Acceptance Criteria

- [ ] Board loads < 800ms with 100 deals across 6 stages
- [ ] Drag-drop 60fps on desktop Chrome
- [ ] Column headers show count + ₹ sum correctly
- [ ] Overdue deals visually distinct
- [ ] View switcher Board/List functional
- [ ] Filters persist in URL query params
- [ ] Optimistic UI with rollback on API failure
- [ ] Mobile accordion replaces Kanban < 768px
- [ ] Visual design passes "Vastora test" — not mistaken for Zoho clone
- [ ] Matches design tokens in `Admin/src/index.css`

---

**Previous:** [03 — Deal Data Model](./03-deal-data-model.md)  
**Next:** [05 — Deal List & Table View](./05-deal-list-table-ui.md)
