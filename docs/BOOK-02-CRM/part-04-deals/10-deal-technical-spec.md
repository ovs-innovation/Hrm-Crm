# Chapter 10 — Deal Pipeline — Technical Spec & Master Acceptance

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 10  
**Version:** 1.0.0-draft

---

## 10.1 Complete ERD (Part 4)

```
pipelines ──< pipeline_stages ──< deals >── companies
                                  │
                                  ├── contacts (primary)
                                  ├── users (owner)
                                  └── lost_reasons
```

---

## 10.2 API Catalog

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/crm/deals/board` | Kanban data |
| GET | `/api/v1/crm/deals` | Paginated list |
| POST | `/api/v1/crm/deals` | Create |
| GET | `/api/v1/crm/deals/:id` | Detail 360 |
| PATCH | `/api/v1/crm/deals/:id` | Update |
| PATCH | `/api/v1/crm/deals/:id/stage` | Stage change |
| POST | `/api/v1/crm/deals/:id/win` | Mark won |
| POST | `/api/v1/crm/deals/:id/lost` | Mark lost |
| DELETE | `/api/v1/crm/deals/:id` | Soft delete |
| PATCH | `/api/v1/crm/deals/bulk-stage` | Bulk stage |
| PATCH | `/api/v1/crm/deals/bulk-assign` | Bulk assign |
| GET | `/api/v1/crm/deals/forecast` | Forecast |
| GET/POST/PUT | `/api/v1/crm/pipelines/*` | Pipeline CRUD |

---

## 10.3 UI Implementation Checklist (Frontend)

Align with `Admin/src/index.css` tokens and [Book 13 Kanban spec](../../BOOK-13-UI-UX-SYSTEM/README.md):

| Component | File Target |
|-----------|-------------|
| `PipelineBoard` | `features/crm/components/PipelineBoard.jsx` |
| `DealCard` | `features/crm/components/DealCard.jsx` |
| `StageColumn` | `features/crm/components/StageColumn.jsx` |
| `DealStageStepper` | `features/crm/components/DealStageStepper.jsx` |
| `DealListTable` | `features/crm/components/DealListTable.jsx` |
| `DealDetail360` | `pages/crm/DealDetail.jsx` |

Use `@dnd-kit/core` or `react-beautiful-dnd` for drag-drop — prefer `@dnd-kit` (maintained).

---

## 10.4 Zoho-Inspired UX Checklist (Vastora Build)

| Pattern | Implement |
|---------|-----------|
| Pipeline as default sales view | ✅ |
| Horizontal Kanban columns | ✅ |
| Column deal count + value | ✅ |
| Board/List toggle | ✅ |
| Dense filter bar | ✅ |
| Deal card: title, account, amount, date, owner | ✅ |
| Stage stepper on detail | ✅ |
| Quick add deal per column | ✅ |
| Bulk update from list | ✅ |
| Footer pipeline summary | ✅ |
| **Copy Zoho colors/layout** | ❌ Blocked |

---

## 10.5 Edge Cases

| # | Case | Expected |
|---|------|----------|
| E1 | Move to won via drag | Opens win modal |
| E2 | Stage requires amount | Block with inline fix |
| E3 | Delete pipeline with deals | 409 |
| E4 | Contact unlinked from company | 422 on deal save |
| E5 | Concurrent stage drag | Last write wins + refresh |
| E6 | 500 deals on board | Virtualize cards per column `[P1]` |

---

## 10.6 Part 4 Master Acceptance Criteria

### Data & API
- [ ] pipelines, pipeline_stages, deals, lost_reasons tables
- [ ] Default pipeline seeded per tenant
- [ ] Board API returns nested stage/deal structure
- [ ] Win/loss workflows complete

### UI — Pipeline Board (Priority)
- [ ] Zoho-density Kanban with Vastora branding
- [ ] Drag-drop stage change with optimistic UI
- [ ] Filters + view switcher
- [ ] Mobile accordion fallback

### UI — Deal 360
- [ ] Stage stepper
- [ ] Mark won/lost flows
- [ ] Insight panel

### Cross-cutting
- [ ] Tenant + permission enforcement
- [ ] Audit on all stage changes
- [ ] Desktop + tablet + mobile specs implemented

---

## 10.7 Sign-off

| Role | Approved |
|------|----------|
| Product | ☐ |
| Engineering | ☐ |
| Design | ☐ |
| QA | ☐ |

---

**Part 4 Complete.**  
**Next:** [Part 5 — Activities & Calendar](../part-05-activities/README.md)
