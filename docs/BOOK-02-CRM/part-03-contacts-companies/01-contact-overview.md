# Chapter 1 — Contact & Company Overview

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 1  
**Version:** 1.0.0-draft

---

## 1.1 Definitions

| Entity | Definition | Analogy |
|--------|------------|---------|
| **Contact** | A person you do business with | HubSpot Contact, Salesforce Contact |
| **Company** | An organization/account a contact belongs to | HubSpot Company, Salesforce Account |

**Rule:** Deals attach to **Company** (primary) and **Contact** (decision maker). Invoices bill to **Company** with **Contact** as billing contact.

---

## 1.2 Entity Hierarchy

```
Tenant
  └── Company (Account)
        ├── parent_company_id → Subsidiary hierarchy [P1]
        ├── branch_offices[] → Multiple locations
        ├── billing_addresses[] (multiple)
        ├── shipping_addresses[] (multiple)
        └── ContactCompanyRole (M:N)
              └── Contact (Person)
                    ├── roles: decision_maker, finance, technical, ...
                    ├── tags, segments
                    └── lifecycle: active, inactive, churned
```

---

## 1.3 Contact Lifecycle

| Status | Code | Description |
|--------|------|-------------|
| Active | `active` | Current customer or prospect in play |
| Inactive | `inactive` | No longer engaged; retain history |
| Churned | `churned` | Was customer; lost `[P1]` |
| Do Not Contact | `dnc` | Legal/marketing opt-out |

**Transitions:** Any status → any (with audit); `dnc` blocks outbound email/WhatsApp.

---

## 1.4 Company Lifecycle

| Status | Code | Description |
|--------|------|-------------|
| Prospect | `prospect` | No won deal yet |
| Customer | `customer` | ≥1 won deal or paid invoice |
| Partner | `partner` | Channel/referral partner `[P1]` |
| Inactive | `inactive` | No activity > configurable period |

Auto-promote: `prospect` → `customer` on first Deal Won or Invoice Paid.

---

## 1.5 Relationship to Leads

```
Lead (temporary) ──convert──► Contact + Company
Contact (existing) ◄──link── Lead conversion (duplicate handling)
Company (existing) ◄──link── Lead conversion (fuzzy match)
```

Post-conversion: Lead preserved read-only with backlinks to Contact/Company.

---

## 1.6 Cross-Module Dependencies

| Module | Uses Contact/Company For |
|--------|--------------------------|
| Deals (Part 4) | `deal.company_id`, `deal.primary_contact_id` |
| Quotations (Part 6) | Bill-to company, ship-to address, contact |
| Invoices (Part 7) | GSTIN from company, billing address |
| Projects (Book 4) | Client company, stakeholder contacts |
| Support (Book 1) | Ticket requester contact |
| Client Portal | Contact → portal user mapping |
| HRM | No direct link (employees ≠ contacts) |

---

## 1.7 Tenant Scope

| Rule | Specification |
|------|---------------|
| TS-C01 | Every `contacts`, `companies`, and junction row includes `tenant_id` |
| TS-C02 | API queries always filter `WHERE tenant_id = :current_tenant` |
| TS-C03 | Cross-tenant contact/company access returns 404 (not 403, to prevent enumeration) |
| TS-C04 | Public web form creates contacts/leads scoped to form's tenant |
| TS-C05 | Unique constraints scoped per tenant: `(tenant_id, lower(email))` on contacts |

---

## 1.8 Permissions (Summary)

Full matrix in [Chapter 12](./12-contact-technical-spec.md). Key permissions:

- `crm:contact:create|read|read_all|update|delete|merge|export|import`
- `crm:company:create|read_all|update|delete|merge|export|import`

---

## 1.9 Audit Log (Summary)

| Event | Logged Fields |
|-------|---------------|
| contact.created | contact_id, created_by |
| contact.updated | contact_id, changed_fields[], updated_by |
| contact.deleted | contact_id, deleted_by |
| contact.merged | primary_id, secondary_id, merged_by |
| company.created / updated / deleted / merged | same pattern |
| contact_company.role_assigned | contact_id, company_id, role |
| contact.status_changed | from, to, reason |
| company.status_changed | from, to |

Retention per plan: 30/90/365 days (Book 1).

---

## 1.10 UI Flow — Create Contact (High Level)

```
User → Contacts → + New Contact
  → Form (person + optional company link)
  → Duplicate check (email/phone)
  → Save → Contact 360 profile
  → Activity: "Contact created"
```

Detailed flows in Chapters 4–6.

---

## 1.11 Responsive Summary

| Surface | Contact List | Contact 360 | Company 360 |
|---------|--------------|-------------|-------------|
| Desktop | Full table | 2-col: tabs + right panel | 2-col layout |
| Tablet | Table, hide columns | Right panel below header | Tabs stack |
| Mobile | Card list | Single col; tabs as horizontal scroll | Single col |

---

## 1.12 Acceptance Criteria

- [ ] Contact and Company definitions documented and aligned with Lead conversion (Part 2)
- [ ] Lifecycle statuses defined with transition rules
- [ ] Tenant isolation rules TS-C01 through TS-C05 approved
- [ ] Cross-module FK strategy agreed for Deals, Quotes, Invoices
- [ ] Stakeholder sign-off that Part 3 precedes Part 4 build

---

**Next:** [02 — Contact Data Model](./02-contact-data-model.md)
