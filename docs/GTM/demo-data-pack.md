# Demo Data Pack — Vastora CRM

**Version:** 1.0.0-draft  
**Purpose:** Pre-seed realistic data for sales demos and trial onboarding

---

## Demo Tenant Profile

| Attribute | Value |
|-----------|-------|
| Company | NovaTech Solutions Pvt Ltd |
| Industry | IT Services |
| Size | 45 employees |
| Location | Bangalore, India |

---

## Seed Data Summary

| Entity | Count | Notes |
|--------|-------|-------|
| Leads | 25 | Mix of statuses and sources |
| Contacts | 40 | Linked to companies |
| Companies | 15 | B2B accounts |
| Deals | 18 | Across 5 pipeline stages |
| Quotations | 6 | 2 pending approval |
| Invoices | 4 | 2 paid, 1 overdue, 1 draft |
| Payments | 2 | Linked to paid invoices |
| Products | 10 | Services + software licenses |
| Employees | 20 | Sample HRM data |
| Activities | 50+ | Calls, emails, meetings |

---

## Hero Demo Deals (For Live Demo)

| Deal | Stage | Value | Story |
|------|-------|-------|-------|
| Acme Corp Enterprise License | Negotiation | ₹8,50,000 | About to close — show quote |
| TechStart MVP Development | Proposal | ₹3,20,000 | Quote pending approval |
| GlobalRetail Support Contract | Won | ₹12,00,000 | Show invoice + payment |
| MedHealth Portal | Qualified | ₹5,50,000 | Early stage — show lead conversion |

---

## Demo Script (10 Minutes)

```
1. Login → CEO Dashboard (pipeline ₹42L, won MTD ₹8L)     [1 min]
2. CRM → Deals Board → drag deal to next stage            [1 min]
3. Open Acme deal → Activity timeline → Log call          [1 min]
4. Create Quote → 3 line items + GST → PDF preview        [2 min]
5. Approve quote → Mark deal Won → Project created        [1 min]
6. Generate Invoice → Send → Record payment             [2 min]
7. CRM Reports → Funnel + team performance                [1 min]
8. Quick: Lead list → Convert lead modal                  [1 min]
```

---

## Implementation

**Script:** `Backend/scripts/seed-demo-crm.js` `[To Build]`

- Idempotent: running twice doesn't duplicate
- Flag: `tenant.is_demo = true`
- Reset demo data button in Settings (tenant_admin)

---

## Sample Products (Catalog)

| SKU | Name | Price | GST |
|-----|------|-------|-----|
| SVC-DEV-001 | Custom Software Development (per hour) | ₹2,500 | 18% |
| SVC-CONS-001 | IT Consulting (per day) | ₹18,000 | 18% |
| LIC-ENT-001 | Enterprise SaaS License (annual) | ₹1,20,000 | 18% |
| SVC-SUP-001 | Annual Support & Maintenance | ₹60,000 | 18% |
| SVC-IMPL-001 | Implementation & Training | ₹45,000 | 18% |
