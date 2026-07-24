# Chapter 7 — Contact–Company Relationships

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 7  
**Version:** 1.0.0-draft

---

## 7.1 Relationship Model

Contacts and Companies are **many-to-many** via junction table `contact_company_roles`.

```
Contact A ──decision_maker──► Company X
Contact A ──consultant───────► Company Y   (same person, two companies)
Contact B ──finance──────────► Company X
Contact C ──technical────────► Company X
```

---

## 7.2 Table: `contact_company_roles`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | |
| `tenant_id` | UUID | ✅ | |
| `contact_id` | UUID | ✅ | FK contacts |
| `company_id` | UUID | ✅ | FK companies |
| `role` | ENUM | ✅ | See roles below |
| `role_label` | VARCHAR(100) | ❌ | Custom label if role=other |
| `is_primary` | BOOLEAN | ✅ | Primary company for this contact |
| `is_primary_contact` | BOOLEAN | ✅ | Primary contact for this company |
| `started_at` | DATE | ❌ | Role start date `[P1]` |
| `ended_at` | DATE | ❌ | Role end (former employee) `[P1]` |
| `created_at` | TIMESTAMP | ✅ | |

**Unique constraint:** `(tenant_id, contact_id, company_id)` — one role row per pair; role updates in place.

---

## 7.3 Contact Roles (Predefined)

| Role Code | Display Name | Typical Use |
|-----------|--------------|-------------|
| `decision_maker` | Decision Maker | Signs deals, final approval |
| `finance` | Finance / Procurement | Invoices, POs, payments |
| `technical` | Technical | Evaluates product, integration |
| `influencer` | Influencer | Internal champion |
| `end_user` | End User | Day-to-day user |
| `legal` | Legal | Contracts `[P1]` |
| `executive` | Executive Sponsor | C-level `[P1]` |
| `other` | Other | Free-text `role_label` |

Tenant can hide roles in settings; cannot delete system roles.

---

## 7.4 Primary Flags Rules

| Flag | Rule |
|------|------|
| `is_primary` (on contact) | Exactly one company marked primary per contact (default on first link) |
| `is_primary_contact` (on company) | Exactly one contact marked primary per company |

When setting new primary: previous primary auto-unset in same transaction.

---

## 7.5 Business Rules

| Rule | Description |
|------|-------------|
| R-001 | Contact can link to unlimited companies (practical limit 50) |
| R-002 | Company can have unlimited contacts |
| R-003 | Deleting contact soft-deletes junction rows |
| R-004 | Deleting company requires no open deals OR force archive `[Part 4]` |
| R-005 | Unlinking contact from company does not delete contact |
| R-006 | Deal.primary_contact_id must be linked to deal.company_id via junction |
| R-007 | Former role: set `ended_at`, keep row for history `[P1]` |

---

## 7.6 UI Flow — Set Primary Contact for Company

```
Company 360 → Contacts → Click ★ on Priya Nair
  → PATCH /companies/:id/contacts/:contactId { is_primary_contact: true }
  → Previous primary star removed
  → Toast "Primary contact updated"
  → Audit: contact_company.primary_changed
```

---

## 7.7 UI Flow — Contact Works at Multiple Companies

```
Contact 360 → Overview → Companies section → + Link Company
  → Search company → Select role → Save
  → Contact appears on both Company 360 contact lists
  → Deals can reference contact in context of either company (deal.company_id must match)
```

---

## 7.8 API Contracts

**POST** `/api/v1/crm/companies/:companyId/contacts`

```json
{
  "contact_id": "uuid",
  "role": "finance",
  "is_primary_contact": false
}
```

**PATCH** `/api/v1/crm/companies/:companyId/contacts/:contactId`

```json
{ "role": "decision_maker", "is_primary_contact": true }
```

**DELETE** `/api/v1/crm/companies/:companyId/contacts/:contactId` — unlink

**GET** `/api/v1/crm/contacts/:contactId/companies` — list companies for contact

---

## 7.9 ERD

```
contacts ──< contact_company_roles >── companies
                    │
                    ├── role (enum)
                    ├── is_primary
                    └── is_primary_contact
```

---

## 7.10 Tenant Scope

Junction rows inherit tenant_id; contact and company must belong to same tenant on link.

---

## 7.11 Permissions

| Action | Permission |
|--------|------------|
| Link contact to company | `crm:company:update` |
| Change role | `crm:company:update` |
| Unlink | `crm:company:update` |
| Set primary | `crm:company:update` |

---

## 7.12 Audit Log

`contact_company.linked`, `contact_company.unlinked`, `contact_company.role_changed`, `contact_company.primary_changed`

---

## 7.13 Responsive

Role management via same modals on all breakpoints; on mobile, company links shown as stacked cards on Contact Overview.

---

## 7.14 Acceptance Criteria

- [ ] M:N junction table with role enum implemented
- [ ] Primary company per contact enforced (DB trigger or app logic)
- [ ] Primary contact per company enforced
- [ ] All 8 role types available in UI dropdown
- [ ] Unlink preserves contact and company records
- [ ] Deal creation validates contact belongs to selected company
- [ ] API link/unlink/patch endpoints functional

---

**Next:** [08 — Import, Export & Deduplication](./08-import-export-deduplication.md)
