# Chapter 3 — Deal Data Model

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 3  
**Version:** 1.0.0-draft

---

## 3.1 ERD

```
companies ──< deals >── contacts (primary_contact)
                │
                ├── pipeline_stages (stage_id)
                ├── pipelines (pipeline_id)
                ├── users (owner_id)
                └── quotations / invoices (Part 6/7)
```

---

## 3.2 Table: `deals`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | |
| `tenant_id` | UUID | ✅ | |
| `title` | VARCHAR(255) | ✅ | Deal name |
| `company_id` | UUID | ✅ | FK companies |
| `primary_contact_id` | UUID | ✅ | FK contacts |
| `pipeline_id` | UUID | ✅ | FK pipelines |
| `stage_id` | UUID | ✅ | FK pipeline_stages |
| `owner_id` | UUID | ✅ | FK users |
| `amount` | DECIMAL(15,2) | ❌ | Deal value |
| `currency` | CHAR(3) | ✅ | Default INR |
| `probability` | INT | ❌ | Override stage default `[P1]` |
| `expected_close_date` | DATE | ❌ | |
| `actual_close_date` | DATE | ❌ | Set on won/lost |
| `status` | ENUM | ✅ | `open`, `won`, `lost` |
| `lost_reason_id` | UUID | ❌ | FK lost_reasons |
| `lost_notes` | TEXT | ❌ | |
| `lead_id` | UUID | ❌ | Origin lead |
| `description` | TEXT | ❌ | |
| `next_step` | VARCHAR(255) | ❌ | `[P1]` |
| `next_step_date` | DATE | ❌ | |
| `weighted_amount` | DECIMAL(15,2) | ❌ | Computed cache |
| `is_deleted` | BOOLEAN | ✅ | |
| `created_by` | UUID | ✅ | |
| `created_at` | TIMESTAMP | ✅ | |
| `updated_at` | TIMESTAMP | ✅ | |

---

## 3.3 Computed Fields

```sql
weighted_amount = amount * COALESCE(deal.probability, stage.probability) / 100
is_overdue = expected_close_date < CURRENT_DATE AND status = 'open'
```

Updated via trigger or app layer on save.

---

## 3.4 Validation

| Rule | Description |
|------|-------------|
| VD-01 | primary_contact must exist in contact_company_roles for company_id |
| VD-02 | amount ≥ 0 |
| VD-03 | Cannot set status won/lost without using win/loss workflow |
| VD-04 | stage must belong to deal's pipeline |

---

## 3.5 Tenant Scope

All FKs validated same-tenant on insert/update.

---

## 3.6 API — Create Deal

**POST** `/api/v1/crm/deals`

```json
{
  "title": "Acme Enterprise License",
  "company_id": "uuid",
  "primary_contact_id": "uuid",
  "pipeline_id": "uuid",
  "stage_id": "uuid",
  "owner_id": "uuid",
  "amount": 850000,
  "expected_close_date": "2026-08-15"
}
```

---

## 3.7 Acceptance Criteria

- [ ] Schema supports Part 6–8 links
- [ ] Contact-company validation enforced
- [ ] Indexes on tenant_id+stage_id, tenant_id+owner_id, expected_close_date

---

**Next:** [04 — Kanban Pipeline Board UI](./04-deal-kanban-board-ui.md)
