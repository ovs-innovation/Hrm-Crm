# Chapter 8 — Win & Loss Workflows

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 8  
**Version:** 1.0.0-draft

---

## 8.1 Mark as Won

### UI Flow

```
Deal 360 → Mark Won
  → Modal: Confirm amount, close date (default today)
  → ☑ Create project draft
  → ☑ Create invoice draft
  → ☑ Notify finance team
  → Confirm
  → stage → Closed Won, status → won, actual_close_date set
  → company.status → customer (if prospect)
  → Timeline + audit
  → Redirect option to Quote/Invoice/Project
```

### API

**POST** `/api/v1/crm/deals/:id/win`

```json
{
  "actual_close_date": "2026-07-20",
  "final_amount": 850000,
  "create_project": true,
  "create_invoice_draft": true
}
```

---

## 8.2 Mark as Lost

### UI Flow

```
Mark Lost → Modal
  → Lost reason* (dropdown)
  → Competitor name [optional]
  → Notes
  → Confirm
  → stage → Closed Lost, status → lost
  → Cannot revert without manager approval `[P1]`
```

### Lost Reasons (Default)

- Chose competitor
- Budget / pricing
- No decision / stalled
- Not a fit
- Timing
- Other

**Table:** `lost_reasons` (tenant_id, name, is_active)

---

## 8.3 Reopen Deal `[P1]`

sales_manager+ can move won/lost deal back to open stage with audit `deal.reopened` + reason required.

---

## 8.4 Kanban Behavior

- Won/Lost columns accept drops → triggers same modals
- Cards in closed columns visually distinct (green/red top border)
- Closed deals hidden from default board filter ("Open deals" default)

---

## 8.5 Permissions

| Action | Permission |
|--------|------------|
| Mark won | `crm:deal:update` |
| Mark lost | `crm:deal:update` |
| Reopen | `crm:deal:update_all` |

---

## 8.6 Audit Log

`deal.won`, `deal.lost`, `deal.reopened` with full payload.

---

## 8.7 Acceptance Criteria

- [ ] Win flow creates optional project + invoice draft
- [ ] Loss requires reason
- [ ] Company promoted to customer on first win
- [ ] Closed deals excluded from open pipeline metrics
- [ ] Win/loss modals work from board and detail page

---

**Next:** [09 — Deal → Project Automation](./09-deal-project-automation.md)
