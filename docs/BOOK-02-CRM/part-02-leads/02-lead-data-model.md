# Chapter 2 — Lead Data Model & Fields

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 2  
**Version:** 1.0.0-draft

---

## 2.1 Entity: `leads`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | Primary key |
| `tenant_id` | UUID | ✅ | Tenant isolation |
| `first_name` | VARCHAR(100) | ✅ | |
| `last_name` | VARCHAR(100) | ❌ | |
| `email` | VARCHAR(255) | ❌* | Lowercase normalized |
| `phone` | VARCHAR(20) | ❌* | Normalized digits |
| `company_name` | VARCHAR(200) | ❌ | Free text until Company entity linked |
| `job_title` | VARCHAR(100) | ❌ | |
| `source` | VARCHAR(50) | ✅ | FK to lead_sources |
| `status` | ENUM | ✅ | See status flow chapter |
| `rating` | ENUM | ❌ | `hot`, `warm`, `cold` — default null |
| `owner_id` | UUID | ❌ | Assigned sales rep |
| `description` | TEXT | ❌ | Initial inquiry notes |
| `expected_value` | DECIMAL(15,2) | ❌ | Estimated deal value |
| `currency` | CHAR(3) | ✅ | Default `INR` |
| `address_line1` | VARCHAR(255) | ❌ | |
| `city` | VARCHAR(100) | ❌ | |
| `state` | VARCHAR(100) | ❌ | |
| `country` | CHAR(2) | ❌ | ISO code, default `IN` |
| `postal_code` | VARCHAR(20) | ❌ | |
| `website` | VARCHAR(255) | ❌ | |
| `linkedin_url` | VARCHAR(255) | ❌ | |
| `utm_source` | VARCHAR(100) | ❌ | `[P1]` |
| `utm_medium` | VARCHAR(100) | ❌ | `[P1]` |
| `utm_campaign` | VARCHAR(100) | ❌ | `[P1]` |
| `converted_at` | TIMESTAMP | ❌ | Set on conversion |
| `converted_contact_id` | UUID | ❌ | FK contacts |
| `converted_company_id` | UUID | ❌ | FK companies |
| `converted_deal_id` | UUID | ❌ | FK deals |
| `is_deleted` | BOOLEAN | ✅ | Soft delete, default false |
| `deleted_at` | TIMESTAMP | ❌ | |
| `created_by` | UUID | ✅ | User who created |
| `created_at` | TIMESTAMP | ✅ | |
| `updated_at` | TIMESTAMP | ✅ | |

*At least one of email or phone required (DB check constraint).

---

## 2.2 Indexes

```sql
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status) WHERE is_deleted = false;
CREATE INDEX idx_leads_tenant_owner ON leads(tenant_id, owner_id) WHERE is_deleted = false;
CREATE INDEX idx_leads_tenant_email ON leads(tenant_id, lower(email)) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_tenant_phone ON leads(tenant_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_leads_created_at ON leads(tenant_id, created_at DESC);
```

---

## 2.3 Related Entities

| Entity | Relationship |
|--------|--------------|
| `activities` | polymorphic `record_type=lead`, `record_id=lead.id` |
| `notes` | polymorphic on lead |
| `documents` | polymorphic on lead |
| `lead_custom_field_values` | EAV for custom fields `[P1]` |

---

## 2.4 Custom Fields `[P1]`

Tenant-defined fields stored in EAV pattern:

| Field Type | Supported |
|------------|-----------|
| Text | ✅ |
| Number | ✅ |
| Date | ✅ |
| Dropdown | ✅ |
| Multi-select | ✅ |
| Checkbox | ✅ |

Max 25 custom fields per tenant on Growth; unlimited on Enterprise.

---

## 2.5 Migration from Legacy `Client` Model

| Client Field | Lead Field |
|--------------|------------|
| `name` | Split to `first_name` / `last_name` (best effort) |
| `company` | `company_name` |
| `email` | `email` |
| `phone` | `phone` |
| `status = 'Lead'` | `status = new` |
| `notes` | `description` + first Note record |
| — | `source = import` (migration flag) |

Clients with `status = Active/Inactive` migrate to Contact/Company (Part 3).

---

**Next:** [03 — Lead List & Detail UI](./03-lead-list-detail-ui.md)
