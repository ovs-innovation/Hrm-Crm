# Chapter 6 — Company Profile 360

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 6  
**Version:** 1.0.0-draft

---

## 6.1 Purpose

**Company 360** is the account-level view for B2B sales — all contacts, deals, revenue, and projects for an organization in one place.

**Route:** `/crm/companies/:id`  
**Permission:** `crm:company:read_all`

---

## 6.2 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CRM > Companies > ABC Pvt Ltd                                               │
├──────────────────────────────────────────────────────────┬──────────────────┤
│ ┌──────────────────────────────────────────────────────┐│ ACCOUNT SUMMARY  │
│ │ [Logo] ABC Pvt Ltd              [Customer ▾]         ││                  │
│ │ IT Services · Bangalore · 250 employees              ││ Open Pipeline    │
│ │ GSTIN: 27AABCU9603R1ZM · PAN: AABCU9603R            ││ ₹42,00,000       │
│ │ 🌐 abc.com · +91 80 1234 5678                       ││                  │
│ │ Parent: —  │  Subsidiaries: 2                       ││ Won Revenue      │
│ │ [+ Contact] [+ Deal] [Log Activity] [Edit] [⋮]      ││ ₹1.2 Cr          │
│ └──────────────────────────────────────────────────────┘│                  │
│                                                          │ Contacts: 8      │
│ [Overview][Contacts][Deals][Projects][Invoices][Payments]│ Open Deals: 3   │
│ [Support][Assets][Documents][Meetings][Timeline][Analytics]│ Overdue: ₹50K  │
│ [AI Summary]                                             │                  │
│ ┌──────────────────────────────────────────────────────┐│ Health: 78       │
│ │              TAB CONTENT                              ││ AI Summary [P1]  │
│ └──────────────────────────────────────────────────────┘│ "Strong account…"│
└──────────────────────────────────────────────────────────┴──────────────────┘
```

---

## 6.3 Tabs Specification

| Tab | Content | MVP |
|-----|---------|-----|
| **Overview** | Firmographics, tax IDs, hierarchy, addresses, description | ✅ |
| **Contacts** | All linked contacts with roles | ✅ |
| **Deals** | Pipeline + won/lost deals for account | ✅ Part 4 |
| **Projects** | Linked projects | ✅ Book 4 |
| **Invoices** | All invoices billed to company | ✅ Part 7 |
| **Payments** | Payment history | ✅ Part 8 |
| **Support Tickets** | Open/closed tickets | P1 |
| **Assets** | Assigned equipment `[HRM]` | P2 |
| **Documents** | Contracts, MSAs, uploads | ✅ |
| **Meetings** | Account-level meetings | P1 |
| **Timeline** | Unified activity feed | ✅ |
| **Analytics** | Revenue trend, deal velocity chart | P1 |
| **AI Summary** | Auto-generated account brief | P1 |

---

## 6.4 Overview Tab Sections

### Firmographics
Industry, sub-industry, annual revenue, employee count, founded year, company type, website, LinkedIn

### Tax & Legal (India)
GSTIN, PAN, TAN — with copy-to-clipboard buttons. Masked on screen for non-finance roles `[P1]`: `27AABCU****R1ZM`

### Hierarchy
- Parent company (link up)
- Subsidiaries list (links down)
- Org tree visual `[P1]`: collapsible tree, max 3 levels visible

### Addresses
Tabs: Billing | Shipping | Branches | Registered  
Each: table with label, full address, primary badge, Edit/Delete

### Account Team `[P1]`
Users assigned to this account (owner + supporting reps)

---

## 6.5 Contacts Tab

```
┌────────────────────────────────────────────────────────────┐
│ Contacts at ABC Pvt Ltd                    [+ Link Contact] │
├────────────────────────────────────────────────────────────┤
│ Name          │ Role              │ Email        │ Primary │
│ John Smith    │ Decision Maker    │ john@…       │ ★       │
│ Priya Nair    │ Finance           │ priya@…      │         │
│ Vikram Das    │ Technical         │ vikram@…     │         │
└────────────────────────────────────────────────────────────┘
```

Actions: View 360, Edit role, Set as primary, Unlink contact

---

## 6.6 UI Flow — Link Existing Contact

```
Company 360 → Contacts → + Link Contact
  → Search contact by name/email
  → Select role (Decision Maker, Finance, Technical, Influencer, End User, Other)
  → ☑ Set as primary contact
  → Save → POST /companies/:id/contacts
  → Audit: contact_company.role_assigned
```

---

## 6.7 UI Flow — View Subsidiary Roll-up

```
Overview → Hierarchy → Click subsidiary "ABC Logistics"
  → Navigate to subsidiary Company 360
  → Breadcrumb: ABC Pvt Ltd > ABC Logistics
```

---

## 6.8 API Contract — Get Company 360

**GET** `/api/v1/crm/companies/:id?include=contacts,addresses,stats,hierarchy`

```json
{
  "id": "uuid",
  "name": "ABC Pvt Ltd",
  "status": "customer",
  "industry": "IT Services",
  "gstin": "27AABCU9603R1ZM",
  "annual_revenue": 50000000,
  "employee_count": 250,
  "parent_company": null,
  "subsidiaries": [
    { "id": "uuid", "name": "ABC Logistics Pvt Ltd" }
  ],
  "addresses": [ { "type": "billing", "label": "HQ", "..." : "..." } ],
  "contacts": [ { "contact_id": "uuid", "name": "John Smith", "role": "decision_maker", "is_primary": true } ],
  "stats": {
    "open_pipeline_value": 4200000,
    "won_revenue": 12000000,
    "contacts_count": 8,
    "open_deals_count": 3,
    "overdue_invoice_amount": 50000
  }
}
```

---

## 6.9 Tenant Scope

Company and all nested contacts/addresses must share `tenant_id`. Subsidiary link rejected if parent in different tenant.

---

## 6.10 Permissions

| Action | Permission |
|--------|------------|
| View Company 360 | `crm:company:read_all` |
| Edit company | `crm:company:update` |
| Link/unlink contact | `crm:company:update` |
| View GSTIN full | `crm:company:read_all` + not masked role |
| + Deal from company | `crm:deal:create` |
| View projects | `projects:read_all` |

---

## 6.11 Audit Log

`company.updated`, `company.address_*`, `contact_company.linked`, `contact_company.unlinked`, `contact_company.primary_changed`

---

## 6.12 Responsive

| Breakpoint | Behavior |
|------------|----------|
| Desktop | 2-column with account summary panel |
| Tablet | Summary KPIs as 2×2 grid above tabs |
| Mobile | Single column; hierarchy as simple list; addresses in accordion |

---

## 6.13 Acceptance Criteria

- [ ] Company 360 renders all MVP tabs
- [ ] Contacts tab shows roles and primary flag
- [ ] Multiple addresses manageable per type
- [ ] Parent/subsidiary navigation works both directions
- [ ] GSTIN/PAN display with copy button; masking for sales_rep `[P1]`
- [ ] Stats panel values match aggregated API
- [ ] + Deal pre-fills company_id on deal create form
- [ ] Mobile: all tabs accessible via horizontal scroll

---

**Next:** [07 — Contact–Company Relationships](./07-contact-company-relationships.md)
