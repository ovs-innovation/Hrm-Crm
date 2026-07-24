# Chapter 5 — Deal List & Table View

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 5  
**Version:** 1.0.0-draft

---

## 5.1 Purpose

**List view** for power users — bulk operations, export, column customization. Zoho-inspired **dense table** with Vastora styling.

**Route:** `/crm/deals`  
**Toggle:** Segmented control links to `/crm/deals/board`

---

## 5.2 Desktop Wireframe

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Deals (18)        [Board] [List ●] [Chart]              [+ New Deal]       │
├────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Search] [Pipeline ▾] [Stage ▾] [Owner ▾] [Close date ▾] [Columns ⚙]   │
├────────────────────────────────────────────────────────────────────────────┤
│ ☐ │ Deal Name        │ Company    │ Stage      │ Amount   │ Close   │ Owner│
│───┼──────────────────┼────────────┼────────────┼──────────┼─────────┼──────│
│ ☐ │ Acme Enterprise  │ ABC Pvt    │ Proposal   │ ₹8.5L    │ Aug 15  │ Amit │
│ ☐ │ TechStart MVP    │ TechStart  │ Negotiation│ ₹3.2L ⚠  │ Jul 20  │ Priya│
├────────────────────────────────────────────────────────────────────────────┤
│ Bulk: [Change Stage ▾] [Assign] [Delete]        Export CSV    Page 1/2 ◂▸ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5.3 Column Customization (Zoho Pattern)

Users toggle visible columns; preference saved in `user_preferences.deal_list_columns`.

**Default columns:** Deal name, Company, Contact, Stage, Amount, Expected close, Owner, Probability, Weighted, Created

**Optional:** Last activity, Next step, Quote status, Tags

---

## 5.4 Row Styling

| Condition | Style |
|-----------|-------|
| Overdue close | `text-danger` on date + row left border danger |
| Won (filter) | Subtle green tint `bg-success/5` |
| Lost | Muted `opacity-75` |
| Hover | `bg-brand-xlight/50` |

---

## 5.5 Inline Stage Change

Click stage badge → dropdown of pipeline stages → select → PATCH (same as kanban move).

---

## 5.6 Bulk Actions

| Action | API | Max |
|--------|-----|-----|
| Change stage | PATCH `/deals/bulk-stage` | 500 |
| Assign owner | PATCH `/deals/bulk-assign` | 500 |
| Delete | DELETE `/deals/bulk` | 100 |

---

## 5.7 API

**GET** `/api/v1/crm/deals?page=&sort=-expected_close_date&stage=&owner=`

Same response shape as standard paginated list.

---

## 5.8 Tenant Scope / Permissions / Audit

Same as Part 4 Chapter 1. Bulk ops log `deal.bulk_updated`.

---

## 5.9 Responsive

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Full table |
| Tablet | Hide weighted, probability, created |
| Mobile | Redirect to board accordion OR card list with 4 fields |

---

## 5.10 Acceptance Criteria

- [ ] Sort on amount, close date, stage, created
- [ ] Column show/hide persists per user
- [ ] Inline stage edit works
- [ ] Bulk stage change with confirmation modal
- [ ] Export CSV respects filters and permissions

---

**Next:** [06 — Deal Detail 360](./06-deal-detail-360.md)
