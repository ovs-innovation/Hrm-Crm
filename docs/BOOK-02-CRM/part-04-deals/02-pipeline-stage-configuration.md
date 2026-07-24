# Chapter 2 — Pipeline & Stage Configuration

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 2  
**Version:** 1.0.0-draft

---

## 2.1 Tables

### `pipelines`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | |
| `name` | VARCHAR(100) | e.g. "Enterprise", "SMB" |
| `is_default` | BOOLEAN | One default per tenant |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |

### `pipeline_stages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | |
| `pipeline_id` | UUID | FK |
| `name` | VARCHAR(100) | |
| `sort_order` | INT | 0-based left-to-right on board |
| `probability` | INT | 0–100 % for forecast |
| `color` | CHAR(7) | Hex for column accent |
| `is_closed_won` | BOOLEAN | Terminal win |
| `is_closed_lost` | BOOLEAN | Terminal loss |
| `rotting_days` | INT | Flag stale deals `[P1]` |
| `required_fields` | JSONB | e.g. `["amount"]` before enter stage |
| `created_at` | TIMESTAMP | |

**Rules:** Exactly one `is_closed_won` and one `is_closed_lost` stage per pipeline (can be same column pair or separate).

---

## 2.2 Default Pipeline (Seed on Tenant Create)

| Order | Stage | Probability | Color |
|-------|-------|-------------|-------|
| 0 | Qualification | 10% | `#5B93CC` |
| 1 | Needs Analysis | 20% | `#296CB2` |
| 2 | Proposal | 40% | `#215D9C` |
| 3 | Negotiation | 60% | `#F59E0B` |
| 4 | Closed Won | 100% | `#22C55E` |
| 5 | Closed Lost | 0% | `#EF4444` |

Zoho-inspired stage names (common industry pattern) — Vastora default seed; fully editable by tenant.

---

## 2.3 Settings UI (`/crm/settings/pipelines`)

```
┌─────────────────────────────────────────────────────────────┐
│ Pipelines                                    [+ New Pipeline] │
├─────────────────────────────────────────────────────────────┤
│ Enterprise (Default)                          [Edit] [⋮]   │
│   Drag to reorder stages:                                   │
│   ≡ Qualification  10%  [color] [⚙]                         │
│   ≡ Needs Analysis 20%  [color] [⚙]                         │
│   ...                                                       │
└─────────────────────────────────────────────────────────────┘
```

**Permission:** `crm:pipeline:manage`

---

## 2.4 Stage Gate Modal (Edit Stage)

| Setting | Description |
|---------|-------------|
| Stage name | Text |
| Win probability | 0–100 slider |
| Color | Color picker (brand palette suggested) |
| Rotting days | Days before "stale" badge |
| Required fields | Multi-select: amount, close_date, contact, quote |
| Auto-actions on enter `[P1]` | Send notification, create task |

---

## 2.5 Tenant Scope

Max pipelines: Growth = 3, Enterprise = unlimited. Stages max 12 per pipeline.

---

## 2.6 Audit Log

`pipeline.created`, `pipeline.updated`, `stage.created`, `stage.reordered`, `stage.deleted` (blocked if deals in stage)

---

## 2.7 API

| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/crm/pipelines` |
| POST | `/api/v1/crm/pipelines` |
| PUT | `/api/v1/crm/pipelines/:id` |
| POST | `/api/v1/crm/pipelines/:id/stages` |
| PATCH | `/api/v1/crm/pipelines/:id/stages/reorder` |
| DELETE | `/api/v1/crm/stages/:id` (409 if deals exist) |

---

## 2.8 Acceptance Criteria

- [ ] Default pipeline seeded on tenant creation
- [ ] Stage reorder reflects immediately on board
- [ ] Cannot delete stage with active deals
- [ ] Required field gates enforced on kanban drop

---

**Next:** [03 — Deal Data Model](./03-deal-data-model.md)
