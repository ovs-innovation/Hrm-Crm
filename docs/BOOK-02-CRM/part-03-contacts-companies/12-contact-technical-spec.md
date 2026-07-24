# Chapter 12 — Contacts & Companies — Technical Spec & Master Acceptance

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 12  
**Version:** 1.0.0-draft

---

## 12.1 Complete ERD (Part 3)

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐
│  contacts   │────<│contact_company_roles│>────│  companies  │
└──────┬──────┘     └─────────────────────┘     └──────┬──────┘
       │                                                │
       ├──────────────┬──────────────┐                  │
       ▼              ▼              ▼                  ▼
┌─────────────┐ ┌───────────┐ ┌─────────────┐  ┌─────────────────┐
│contact_tags │ │ activities│ │  documents  │  │company_addresses│
└─────────────┘ └───────────┘ └─────────────┘  └─────────────────┘
       │              │                               │
       ▼              ▼                               │
┌─────────────┐ ┌───────────┐                          │
│    tags     │ │   notes   │     companies.parent_company_id ─┐
└─────────────┘ └───────────┘                                    │
       │                                                         │
       ▼                                                         │
┌─────────────┐                                                  │
│crm_segments │◄─────────────────────────────────────────────────┘
└─────────────┘              (self-referential hierarchy)
```

---

## 12.2 Table Summary

| Table | Purpose |
|-------|---------|
| `contacts` | Person records |
| `companies` | Account/organization records |
| `company_addresses` | Billing, shipping, branch, registered |
| `contact_company_roles` | M:N with role + primary flags |
| `tags` | Tag definitions |
| `contact_tags` | Contact ↔ tag |
| `company_tags` | Company ↔ tag |
| `crm_segments` | Dynamic/static segments |
| `segment_members` | Static segment membership `[P1]` |
| `contact_custom_field_values` | EAV custom fields `[P1]` |
| `import_jobs` | Import history |

---

## 12.3 Full API Catalog — Contacts

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/v1/crm/contacts` | read / read_all |
| POST | `/api/v1/crm/contacts` | create |
| GET | `/api/v1/crm/contacts/:id` | read |
| PATCH | `/api/v1/crm/contacts/:id` | update |
| DELETE | `/api/v1/crm/contacts/:id` | delete |
| GET | `/api/v1/crm/contacts/:id/timeline` | read |
| GET | `/api/v1/crm/contacts/:id/companies` | read |
| POST | `/api/v1/crm/contacts/check-duplicate` | create |
| POST | `/api/v1/crm/contacts/:id/merge` | merge `[P1]` |
| POST | `/api/v1/crm/contacts/import` | import |
| GET | `/api/v1/crm/contacts/export` | export |
| PATCH | `/api/v1/crm/contacts/bulk-assign` | update_all |
| POST | `/api/v1/crm/contacts/:id/tags` | update |
| POST | `/api/v1/crm/contacts/:id/emails` | activity `[P1]` |

---

## 12.4 Full API Catalog — Companies

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/v1/crm/companies` | read_all |
| POST | `/api/v1/crm/companies` | create |
| GET | `/api/v1/crm/companies/:id` | read_all |
| PATCH | `/api/v1/crm/companies/:id` | update |
| DELETE | `/api/v1/crm/companies/:id` | delete |
| GET | `/api/v1/crm/companies/:id/timeline` | read_all |
| GET | `/api/v1/crm/companies/:id/contacts` | read_all |
| POST | `/api/v1/crm/companies/:id/contacts` | update |
| PATCH | `/api/v1/crm/companies/:id/contacts/:cid` | update |
| DELETE | `/api/v1/crm/companies/:id/contacts/:cid` | update |
| POST | `/api/v1/crm/companies/:id/addresses` | update |
| PATCH | `/api/v1/crm/companies/:id/addresses/:aid` | update |
| DELETE | `/api/v1/crm/companies/:id/addresses/:aid` | update |
| POST | `/api/v1/crm/companies/import` | import |
| GET | `/api/v1/crm/companies/export` | export |
| POST | `/api/v1/crm/companies/:id/merge` | merge `[P1]` |

---

## 12.5 Global Validation Rules

| Rule | Applies To |
|------|------------|
| VR-C01 | Email format RFC 5322 simplified |
| VR-C02 | Phone min 10 digits after normalize |
| VR-C03 | GSTIN 15-char regex when provided |
| VR-C04 | PAN 10-char regex when provided |
| VR-C05 | Company name min 2 chars |
| VR-C06 | Hierarchy depth ≤ 5 |
| VR-C07 | No circular parent references |
| VR-C08 | Primary flags: exactly one per scope |
| VR-C09 | DNC blocks outbound email/WhatsApp |
| VR-C10 | Soft delete only; no hard delete with open deals |

---

## 12.6 Permission Matrix (Consolidated)

| Permission | tenant_admin | sales_mgr | sales_rep | finance_mgr | viewer |
|------------|:---:|:---:|:---:|:---:|:---:|
| crm:contact:create | ✅ | ✅ | ✅ | ❌ | ❌ |
| crm:contact:read_all | ✅ | ✅ | 🔶 | ❌ | ✅ |
| crm:contact:update_all | ✅ | ✅ | 🔶 | ❌ | ❌ |
| crm:contact:merge | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:contact:import | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:contact:export | ✅ | ✅ | 🔶 | ❌ | ❌ |
| crm:company:create | ✅ | ✅ | ✅ | ❌ | ❌ |
| crm:company:read_all | ✅ | ✅ | ✅ | ✅ | ✅ |
| crm:company:update | ✅ | ✅ | 🔶 | ❌ | ❌ |
| crm:company:delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:company:merge | ✅ | ✅ | ❌ | ❌ | ❌ |

🔶 = own records or linked accounts only

---

## 12.7 Audit Events (Complete List)

`contact.*`, `company.*`, `contact_company.*`, `contact.tag_*`, `company.tag_*`, `segment.*`, `contact.import_*`, `company.import_*`, `contact.export`, `company.export`

All audit entries include: `tenant_id`, `user_id`, `ip_address`, `timestamp`, `payload JSON`.

---

## 12.8 Tenant Scope (Complete)

- Every table in Part 3 includes `tenant_id NOT NULL`
- FK references validated same-tenant on write
- Public APIs resolve tenant from API key or form_id
- Background jobs (import, segment compute) scoped by tenant_id

---

## 12.9 Edge Cases Master List

| # | Case | Expected |
|---|------|----------|
| E1 | Convert lead to existing contact email | Link, don't duplicate |
| E2 | Delete company with open deals | 409 — close deals first |
| E3 | Merge two companies with same GSTIN | Block unless admin force |
| E4 | Unlink primary contact | Promote next contact or leave none |
| E5 | Import row with invalid GSTIN | Row error, continue batch |
| E6 | Contact at 2 companies, deal on company A | Deal contact must be linked to A |
| E7 | Restore soft-deleted contact with duplicate email | 409 duplicate |
| E8 | Parent company deleted | Children orphaned (parent_id null) |
| E9 | 51st tag on contact | 400 limit exceeded |
| E10 | Cross-tenant ID in URL | 404 |

---

## 12.10 Migration Script Requirements

**Script:** `Backend/scripts/migrate-clients-to-crm.js`

1. For each `Client` where status=`Lead` → create `Lead` (if not already migrated)
2. For each `Client` where status=`Active` → create `Contact` + `Company` + link
3. For each `Client` where status=`Inactive` → create `Contact` status=inactive
4. Map old `/crm` bookmarks → redirect rules
5. Idempotent: skip if `migration_source_id` exists

---

## 12.11 Part 3 — Master Acceptance Criteria

### Data Model
- [ ] All tables created with tenant_id and indexes
- [ ] M:N contact_company_roles with roles and primary flags
- [ ] company_addresses supports billing, shipping, branch, registered
- [ ] Parent/subsidiary hierarchy to depth 5

### API
- [ ] All endpoints in §12.3–12.4 implemented
- [ ] Permission middleware on every route
- [ ] 404 for cross-tenant access

### UI — Contact
- [ ] Contact list with filters, bulk ops, pagination
- [ ] Contact 360 with all MVP tabs + right panel
- [ ] Communication center (call log MVP; email `[P1]`)

### UI — Company
- [ ] Company list page
- [ ] Company 360 with contacts, addresses, hierarchy
- [ ] Link/unlink contacts with roles

### Import/Export
- [ ] Combined CSV import
- [ ] Export with scope enforcement
- [ ] Duplicate detection on create

### Cross-Cutting
- [ ] Audit log on all write operations
- [ ] Desktop + tablet + mobile layouts defined
- [ ] Legacy Client migration script tested
- [ ] Part 4 (Deals) can reference contact_id + company_id without schema changes

---

## 12.12 Sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Product Owner | | | ☐ |
| Engineering Lead | | | ☐ |
| Design Lead | | | ☐ |
| QA Lead | | | ☐ |

---

**Part 3 Complete.**  
**Next Part:** [Part 4 — Deal Pipeline](../part-04-deals/README.md)
