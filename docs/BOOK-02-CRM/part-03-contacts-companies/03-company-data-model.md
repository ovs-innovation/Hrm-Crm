# Chapter 3 — Company Data Model

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 3  
**Version:** 1.0.0-draft

---

## 3.1 ERD — Company & Addresses

```
┌─────────────────┐         ┌─────────────────────┐
│    companies    │────────►│  company_addresses  │
├─────────────────┤   1:N   ├─────────────────────┤
│ id              │         │ id                  │
│ tenant_id       │         │ company_id          │
│ name            │         │ type: billing|shipping|branch
│ parent_company_id│◄──┐    │ is_primary          │
│ gstin           │   │    │ line1, city, state  │
│ pan             │   │    │ country, postal_code│
│ industry        │   │    └─────────────────────┘
│ annual_revenue  │   │
│ employee_count  │   │ self-ref hierarchy
└─────────────────┘   │
        └───────────────┘
```

---

## 3.2 Table: `companies`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | PK |
| `tenant_id` | UUID | ✅ | **Tenant scope** |
| `name` | VARCHAR(255) | ✅ | Legal or trading name |
| `legal_name` | VARCHAR(255) | ❌ | Registered name if different |
| `status` | ENUM | ✅ | `prospect`, `customer`, `partner`, `inactive` |
| `owner_id` | UUID | ❌ | Account owner (sales rep) |
| `parent_company_id` | UUID | ❌ | FK companies — subsidiary hierarchy |
| `website` | VARCHAR(255) | ❌ | |
| `phone` | VARCHAR(20) | ❌ | Main switchboard |
| `email` | VARCHAR(255) | ❌ | info@company.com |
| **India Tax IDs** | | | |
| `gstin` | VARCHAR(15) | ❌ | GST Identification Number |
| `pan` | VARCHAR(10) | ❌ | Permanent Account Number |
| `tan` | VARCHAR(10) | ❌ | Tax Deduction Account `[P1]` |
| **Firmographics** | | | |
| `industry` | VARCHAR(100) | ❌ | From industry picklist |
| `sub_industry` | VARCHAR(100) | ❌ | `[P1]` |
| `annual_revenue` | DECIMAL(18,2) | ❌ | INR |
| `employee_count` | INT | ❌ | Headcount estimate |
| `founded_year` | INT | ❌ | |
| `company_type` | ENUM | ❌ | `private`, `public`, `government`, `ngo` |
| **CRM Metrics (cached)** | | | |
| `total_deal_value` | DECIMAL(15,2) | ❌ | Open pipeline |
| `won_revenue` | DECIMAL(15,2) | ❌ | Lifetime won |
| `last_activity_at` | TIMESTAMP | ❌ | |
| `description` | TEXT | ❌ | |
| `linkedin_url` | VARCHAR(255) | ❌ | |
| `is_deleted` | BOOLEAN | ✅ | |
| `created_by` | UUID | ✅ | |
| `created_at` | TIMESTAMP | ✅ | |
| `updated_at` | TIMESTAMP | ✅ | |

---

## 3.3 Table: `company_addresses`

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | |
| `tenant_id` | UUID | ✅ | |
| `company_id` | UUID | ✅ | FK companies |
| `type` | ENUM | ✅ | `billing`, `shipping`, `branch`, `registered` |
| `label` | VARCHAR(100) | ❌ | e.g. "Mumbai HQ", "Delhi Branch" |
| `line1` | VARCHAR(255) | ✅ | |
| `line2` | VARCHAR(255) | ❌ | |
| `city` | VARCHAR(100) | ✅ | |
| `state` | VARCHAR(100) | ✅ | |
| `postal_code` | VARCHAR(20) | ❌ | |
| `country` | CHAR(2) | ✅ | Default `IN` |
| `is_primary` | BOOLEAN | ✅ | One primary per type per company |
| `gstin` | VARCHAR(15) | ❌ | Branch-specific GSTIN if different |
| `created_at` | TIMESTAMP | ✅ | |

**Rules:**
- Multiple billing addresses allowed; one `is_primary = true` per type
- Multiple shipping addresses for multi-warehouse clients
- Branch offices: `type = branch` with optional separate GSTIN

---

## 3.4 Parent / Subsidiary Hierarchy

```
Tata Group (parent_company_id = null)
  └── TCS (parent = Tata Group)
  └── Tata Motors (parent = Tata Group)
        └── Jaguar Land Rover (parent = Tata Motors) [max depth: 5]
```

| Rule | Description |
|------|-------------|
| CO-H01 | Max hierarchy depth: 5 levels |
| CO-H02 | Circular references rejected on save |
| CO-H03 | Deleting parent does not delete children; orphans get `parent_company_id = null` |
| CO-H04 | Roll-up revenue `[P2]`: optional sum of subsidiary won_revenue |

---

## 3.5 GSTIN / PAN Validation (India)

| Field | Format | Validation |
|-------|--------|------------|
| GSTIN | 15 chars | Regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$` |
| PAN | 10 chars | Regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` |
| TAN | 10 chars | `[P1]` standard format check |

Invalid format → field-level error; save allowed with warning for admin override.

---

## 3.6 Industry Picklist (Default)

IT Services, Software/SaaS, Healthcare, Real Estate, Manufacturing, Retail, Financial Services, Education, Professional Services, Media, Logistics, Other.

Tenant can add custom industries in CRM Settings.

---

## 3.7 Tenant Scope

| Rule | Specification |
|------|---------------|
| TS-Co01 | `(tenant_id, lower(name))` unique among non-deleted `[soft — warn on duplicate]` |
| TS-Co02 | GSTIN unique per tenant when provided |
| TS-Co03 | Subsidiary companies must share same tenant_id as parent |

---

## 3.8 Permissions

| Action | Permission |
|--------|------------|
| Create company | `crm:company:create` |
| Read | `crm:company:read_all` |
| Update | `crm:company:update` |
| Delete | `crm:company:delete` |
| Manage hierarchy | `crm:company:update` |
| View tax IDs | `crm:company:read_all` |
| Edit tax IDs | `crm:company:update` (finance_manager also) |

---

## 3.9 Audit Log

| Event | Notes |
|-------|-------|
| `company.created` | |
| `company.updated` | Field-level diff |
| `company.status_changed` | prospect → customer auto or manual |
| `company.parent_changed` | Hierarchy moves |
| `company.address_added` | address_id, type |
| `company.gstin_updated` | Sensitive — always logged |

---

## 3.10 API Contract — Create Company

**POST** `/api/v1/crm/companies`

```json
{
  "name": "ABC Pvt Ltd",
  "legal_name": "ABC Private Limited",
  "status": "prospect",
  "owner_id": "uuid",
  "parent_company_id": null,
  "website": "https://abc.com",
  "gstin": "27AABCU9603R1ZM",
  "pan": "AABCU9603R",
  "industry": "IT Services",
  "annual_revenue": 50000000,
  "employee_count": 250,
  "addresses": [
    {
      "type": "billing",
      "label": "HQ",
      "line1": "42 MG Road",
      "city": "Bangalore",
      "state": "Karnataka",
      "postal_code": "560001",
      "country": "IN",
      "is_primary": true
    }
  ]
}
```

---

## 3.11 UI Flow — Add Branch Office

```
Company 360 → Addresses tab → + Add Address
  → Type: Branch → Fill form → Save
  → Appears in address list with label
  → Available as ship-to on quotes/invoices (Part 6/7)
```

---

## 3.12 Responsive

| Breakpoint | Company form | Address manager |
|------------|--------------|-----------------|
| Desktop | 2-col form + side address list | Table of addresses |
| Tablet | 2-col | Card list |
| Mobile | 1-col stacked | Full-screen address modal |

---

## 3.13 Acceptance Criteria

- [ ] companies + company_addresses tables approved
- [ ] GSTIN/PAN regex validation implemented
- [ ] Parent/child hierarchy with max depth 5 enforced
- [ ] Multiple billing/shipping addresses with primary flag per type
- [ ] API create company with nested addresses works atomically
- [ ] GSTIN uniqueness per tenant enforced
- [ ] Audit log on tax ID changes

---

**Next:** [04 — Contact List UI](./04-contact-list-ui.md)
