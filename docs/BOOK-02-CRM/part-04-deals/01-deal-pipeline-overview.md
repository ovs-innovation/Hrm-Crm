# Chapter 1 — Deal Pipeline Overview & UX Philosophy

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 1  
**Version:** 1.0.0-draft

---

## 1.1 What Is a Deal?

A **Deal** (Opportunity) is a qualified sales opportunity with an expected value, stage, and close date. Deals always link to:

| FK | Required | Source |
|----|----------|--------|
| `company_id` | ✅ | Part 3 — Company |
| `primary_contact_id` | ✅ | Part 3 — Contact (must be linked to company) |
| `pipeline_id` + `stage_id` | ✅ | Tenant pipeline config |
| `owner_id` | ✅ | Sales rep |

---

## 1.2 Default User Landing — Pipeline Board

**sales_rep** default route: `/crm/deals/board` (not dashboard).

Reason: Zoho-style CRM users live in the **pipeline** — daily work is moving deals forward, not reading widgets.

---

## 1.3 Zoho-Inspired vs Vastora Original

We take **workflow patterns** from enterprise CRMs like [Zoho CRM](https://www.zoho.com/crm/). We do **not** copy layout, colors, icons, or branding.

| Zoho Pattern (Inspiration) | Vastora Implementation (Original) |
|----------------------------|-----------------------------------|
| Horizontal pipeline columns by stage | ✅ Same concept — Kanban board |
| Deal cards show amount + account + date | ✅ Same data density on cards |
| Board / List view toggle | ✅ Board + List + Chart `[P1]` |
| Stage totals at column header | ✅ Count + ₹ sum per stage |
| Inline filters above pipeline | ✅ Sticky filter bar |
| Deal detail with stage path | ✅ Stage stepper in header |
| Related lists (Contacts, Products) | ✅ Tabs: Contact, Quotes, Activities |
| Quick "+ Deal" per column | ✅ Column footer CTA |
| Mass update selected records | ✅ Bulk stage assign |
| **Zoho white/blue chrome** | ❌ **Vastora navy sidebar + #296CB2** |
| **Zoho icon set** | ❌ **Feather icons (react-icons/fi)** |
| **Zoho typography** | ❌ **Inter + IBM Plex Sans for numbers** |

---

## 1.4 Pipeline Screen Hierarchy (Vastora)

```
Level 1: Pipeline Board (/crm/deals/board)     ← Primary workspace (Zoho-like density)
Level 2: Deal List (/crm/deals)                ← Power users, export, bulk edit
Level 3: Deal Detail 360 (/crm/deals/:id)      ← Single deal deep dive
Level 4: CRM Dashboard (/crm)                  ← Manager overview (Part 1)
```

---

## 1.5 End-to-End Deal Flow

```
Create Deal → Stage progression → Quote (Part 6) → Won
                                      ↓
                              Lost (with reason)
                                      ↓
                    Won → Project (Book 4) + Invoice draft (Part 7)
```

---

## 1.6 Tenant Scope

| Rule | Specification |
|------|---------------|
| TS-D01 | All deals scoped by `tenant_id` |
| TS-D02 | Pipeline/stages belong to tenant; no shared pipelines |
| TS-D03 | Deal owner must be user in same tenant |
| TS-D04 | company_id and contact_id must belong to same tenant |

---

## 1.7 Permissions (Summary)

- `crm:deal:create|read|read_all|update|update_all|delete|assign`
- Board drag-drop requires `crm:deal:update` (own) or `update_all`

---

## 1.8 Audit Log

`deal.created`, `deal.stage_changed`, `deal.won`, `deal.lost`, `deal.owner_changed`, `deal.amount_changed`, `deal.deleted`

---

## 1.9 UI Flow — First Visit (Sales Rep)

```
Login → Redirect /crm/deals/board
  → Default pipeline loaded
  → Onboarding tooltip: "Drag deals between stages"
  → Empty column shows "+ Add Deal" ghost card
```

---

## 1.10 Responsive Summary

| Surface | Primary View |
|---------|--------------|
| Desktop | Full Kanban — all columns visible with horizontal scroll if >6 stages |
| Tablet | Kanban with horizontal scroll; condensed cards |
| Mobile | **Stage list view** (not Kanban) — grouped accordion by stage `[MVP]` |

---

## 1.11 Acceptance Criteria

- [ ] Deal entity dependencies on Contact + Company documented
- [ ] Zoho inspiration vs Vastora identity boundary clear for design team
- [ ] sales_rep lands on pipeline board by default
- [ ] Tenant scope rules approved before implementation

---

**Next:** [02 — Pipeline & Stage Configuration](./02-pipeline-stage-configuration.md)
