# Chapter 2 — Contact Data Model

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 2  
**Version:** 1.0.0-draft

---

## 2.1 ERD Fragment

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│    contacts     │       │ contact_company_roles│       │    companies    │
├─────────────────┤       ├──────────────────────┤       ├─────────────────┤
│ id              │───┐   │ id                   │   ┌───│ id              │
│ tenant_id       │   └──►│ contact_id           │   │   │ tenant_id       │
│ first_name      │       │ company_id           │◄──┘   │ name            │
│ email           │       │ role                 │       │ parent_company_id│
│ ...             │       │ is_primary           │       │ ...             │
└─────────────────┘       └──────────────────────┘       └─────────────────┘
        │                                                          │
        ▼                                                          ▼
┌─────────────────┐                                       ┌─────────────────┐
│ contact_tags    │                                       │ company_addresses│
│ contact_segments│                                       │ (billing/ship)  │
└─────────────────┘                                       └─────────────────┘
```

---

## 2.2 Table: `contacts`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | PK |
| `tenant_id` | UUID | ✅ | FK tenants — **mandatory scope** |
| `first_name` | VARCHAR(100) | ✅ | |
| `last_name` | VARCHAR(100) | ❌ | |
| `email` | VARCHAR(255) | ❌* | Lowercase normalized |
| `phone` | VARCHAR(20) | ❌* | E.164 normalized |
| `mobile` | VARCHAR(20) | ❌ | Secondary phone |
| `job_title` | VARCHAR(100) | ❌ | |
| `department` | VARCHAR(100) | ❌ | |
| `status` | ENUM | ✅ | `active`, `inactive`, `churned`, `dnc` |
| `owner_id` | UUID | ❌ | FK users — account owner |
| `source` | VARCHAR(50) | ❌ | Inherited from lead or manual |
| `lead_id` | UUID | ❌ | FK leads — origin if converted |
| `avatar_url` | VARCHAR(500) | ❌ | S3 path |
| `linkedin_url` | VARCHAR(255) | ❌ | |
| `twitter_url` | VARCHAR(255) | ❌ | `[P2]` |
| `preferred_language` | CHAR(5) | ❌ | Default `en-IN` |
| `timezone` | VARCHAR(50) | ❌ | Default tenant TZ |
| `date_of_birth` | DATE | ❌ | `[P2]` — GDPR sensitive |
| `lead_score` | INT | ❌ | 0–100, AI or manual `[P1]` |
| `health_score` | INT | ❌ | 0–100 customer health `[P1]` |
| `lifetime_value` | DECIMAL(15,2) | ❌ | Computed cache from invoices |
| `last_contacted_at` | TIMESTAMP | ❌ | Updated on activity |
| `last_activity_at` | TIMESTAMP | ❌ | Any CRM activity |
| `description` | TEXT | ❌ | Internal notes summary |
| `is_deleted` | BOOLEAN | ✅ | Soft delete |
| `deleted_at` | TIMESTAMP | ❌ | |
| `created_by` | UUID | ✅ | |
| `created_at` | TIMESTAMP | ✅ | |
| `updated_at` | TIMESTAMP | ✅ | |

*At least one of `email` or `phone` required.

---

## 2.3 Table: `contact_custom_field_values` `[P1]`

| Column | Type |
|--------|------|
| `id` | UUID |
| `tenant_id` | UUID |
| `contact_id` | UUID |
| `field_id` | UUID |
| `value_text` | TEXT |
| `value_number` | DECIMAL |
| `value_date` | DATE |
| `value_json` | JSONB |

---

## 2.4 Indexes

```sql
CREATE UNIQUE INDEX uq_contacts_tenant_email
  ON contacts(tenant_id, lower(email))
  WHERE email IS NOT NULL AND is_deleted = false;

CREATE INDEX idx_contacts_tenant_phone
  ON contacts(tenant_id, phone)
  WHERE phone IS NOT NULL AND is_deleted = false;

CREATE INDEX idx_contacts_tenant_owner
  ON contacts(tenant_id, owner_id) WHERE is_deleted = false;

CREATE INDEX idx_contacts_tenant_status
  ON contacts(tenant_id, status) WHERE is_deleted = false;

CREATE INDEX idx_contacts_tenant_name
  ON contacts(tenant_id, lower(last_name), lower(first_name));
```

---

## 2.5 Tenant Scope

- All queries: `tenant_id = auth.tenant_id`
- Email uniqueness per tenant only (same email allowed in different tenants)
- Soft-deleted contacts excluded from unique email index; restore must re-check duplicate

---

## 2.6 Permissions

| Action | Permission |
|--------|------------|
| Create | `crm:contact:create` |
| Read own/linked | `crm:contact:read` |
| Read all | `crm:contact:read_all` |
| Update | `crm:contact:update` / `crm:contact:update_all` |
| Delete | `crm:contact:delete` / `crm:contact:delete_all` |
| View salary-sensitive custom fields | `crm:contact:read_sensitive` `[P1]` |

---

## 2.7 Audit Log Events

| Event | Payload |
|-------|---------|
| `contact.created` | Full snapshot (PII redacted in export) |
| `contact.updated` | `{ field, old_value, new_value }[]` |
| `contact.deleted` | contact_id, reason |
| `contact.restored` | contact_id |
| `contact.status_changed` | from, to, user_id |

---

## 2.8 API Contract — Create Contact

**POST** `/api/v1/crm/contacts`

```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@abc.com",
  "phone": "+919876543210",
  "job_title": "Senior Manager",
  "status": "active",
  "owner_id": "uuid",
  "company_links": [
    { "company_id": "uuid", "role": "decision_maker", "is_primary": true }
  ],
  "tags": ["enterprise", "north-region"]
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@abc.com",
  "status": "active",
  "created_at": "2026-07-20T06:30:00Z"
}
```

**Errors:** `400 VALIDATION_ERROR`, `409 DUPLICATE_EMAIL`, `403 PERMISSION_DENIED`

---

## 2.9 UI Flow — Edit Contact Fields

```
Contact 360 → Overview tab → Edit (inline or modal)
  → Validate → PATCH /contacts/:id
  → Optimistic UI update
  → Toast "Contact updated"
  → Audit log entry
  → Timeline: "John Smith updated job title"
```

---

## 2.10 Responsive

| Breakpoint | Behavior |
|------------|----------|
| Desktop | All fields in 2-column form |
| Tablet | 2-column form |
| Mobile | Single column; sticky Save/Cancel footer |

---

## 2.11 Migration from Legacy `Client`

| Client (status=Active) | Contact |
|--------------------------|---------|
| `name` | Split first_name / last_name |
| `email` | `email` |
| `phone` | `phone` |
| `company` | Create/link Company |
| `notes` | `description` + Note record |
| — | `source = 'import'`, `status = active` |

---

## 2.12 Acceptance Criteria

- [ ] `contacts` table schema reviewed by backend lead
- [ ] Unique email per tenant enforced at DB level
- [ ] At least email OR phone constraint enforced
- [ ] All indexes created in migration script
- [ ] POST /contacts API matches contract above
- [ ] Audit events fire on create/update/delete
- [ ] tenant_id injected from auth context, never from client body

---

**Next:** [03 — Company Data Model](./03-company-data-model.md)
