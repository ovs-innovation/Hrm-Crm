# Chapter 8 — Import, Export & Deduplication

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 8  
**Version:** 1.0.0-draft

---

## 8.1 Import Scope

| Entity | Route | Permission | Max Rows/Batch |
|--------|-------|------------|--------------|
| Contacts | `/crm/contacts/import` | `crm:contact:import` | 10,000 |
| Companies | `/crm/companies/import` | `crm:company:import` | 5,000 |
| Contacts + Companies | Combined CSV | `crm:contact:import` | 10,000 |

---

## 8.2 Combined CSV Template (Recommended)

| Column | Maps To |
|--------|---------|
| contact_first_name | contacts.first_name |
| contact_last_name | contacts.last_name |
| contact_email | contacts.email |
| contact_phone | contacts.phone |
| contact_job_title | contacts.job_title |
| contact_role | contact_company_roles.role |
| company_name | companies.name |
| company_gstin | companies.gstin |
| company_industry | companies.industry |
| company_website | companies.website |
| billing_city | company_addresses.city |
| billing_state | company_addresses.state |
| owner_email | users.email → owner_id |

One row = one contact linked to one company (creates company if not exists by name match).

---

## 8.3 Import Wizard UI Flow

```
Step 1: Upload file (.csv, .xlsx)
Step 2: Map columns (auto-map by header name)
Step 3: Preview 10 rows + validation errors count
Step 4: Duplicate strategy (skip / update / create)
Step 5: Execute → progress bar → summary report
```

---

## 8.4 Company Matching on Import

| Match | Action |
|-------|--------|
| Exact GSTIN match | Link to existing company |
| Exact name match (case-insensitive) | Link; warn if multiple |
| Fuzzy name > 90% | Suggest match; user confirm in preview `[P1]` |
| No match | Create new company |

---

## 8.5 Export

**GET** `/api/v1/crm/contacts/export?format=csv&filters=...`  
**GET** `/api/v1/crm/companies/export?format=csv&filters=...`

- Respects filters and permissions (export only visible records)
- PII columns included per role; audit: `contact.export`, `company.export`
- Async job for > 5,000 rows; email download link

---

## 8.6 Deduplication — Contacts

| Match Rule | Confidence |
|------------|------------|
| Exact email | 100% |
| Exact phone | 95% |
| Same name + same company | 80% |

### Merge UI `[P1]`

```
Select primary contact → Preview merged fields
  → Pick winner per conflicting field
  → Merge activities, notes, deals linkage to primary
  → Soft-delete secondary
  → Audit: contact.merged
```

**Permission:** `crm:contact:merge` (sales_manager+)

---

## 8.7 Deduplication — Companies

| Match Rule | Confidence |
|------------|------------|
| Exact GSTIN | 100% |
| Exact name | 90% |
| Same website domain | 85% `[P1]` |

Merge moves: contacts, deals, invoices, addresses to primary company.

---

## 8.8 API — Import Contacts

**POST** `/api/v1/crm/contacts/import`

```json
{
  "file_id": "uuid-uploaded-to-s3",
  "column_mapping": { "contact_email": "email", "company_name": "company" },
  "duplicate_strategy": "skip",
  "create_companies": true
}
```

**Response 202:**

```json
{
  "job_id": "uuid",
  "status": "processing",
  "estimated_rows": 2400
}
```

---

## 8.9 Tenant Scope

Import jobs scoped to tenant; owner_email must resolve to user in same tenant.

---

## 8.10 Permissions

| Action | Permission |
|--------|------------|
| Import contacts | `crm:contact:import` |
| Import companies | `crm:company:import` |
| Export | `crm:contact:export` / `crm:company:export` |
| Merge contacts | `crm:contact:merge` |
| Merge companies | `crm:company:merge` |

---

## 8.11 Audit Log

`contact.import_started`, `contact.import_completed`, `contact.merged`, `company.merged`, `contact.export`

Import summary stored in `import_jobs` table for 90 days.

---

## 8.12 Responsive

Import wizard full-screen on mobile; column mapping simplified to essential fields only.

---

## 8.13 Acceptance Criteria

- [ ] Combined contact+company CSV import creates both entities and link
- [ ] GSTIN match prevents duplicate companies
- [ ] Duplicate skip/update strategies work correctly
- [ ] Export respects sales_rep scope
- [ ] Merge preserves deal links on primary record
- [ ] Import job history visible in Settings
- [ ] 5000 row import completes < 3 minutes

---

**Next:** [09 — Segmentation & Tags](./09-contact-segmentation-tags.md)
