# Book 2 — CRM Module PRD

**Product:** Vastora CRM  
**Module:** Customer Relationship Management  
**Document Version:** 1.0.0-draft  
**Last Updated:** July 2026  
**Status:** 🟢 Active — Parts 1–4 complete  
**Depends on:** [Book 1 — Master PRD](../BOOK-01-MASTER-PRD/README.md)  
**Estimated Size:** 180–220 pages equivalent

---

## Purpose

Book 2 is the **complete, enterprise-grade product requirement document** for the Vastora CRM module. It covers the full revenue lifecycle:

```
Lead → Contact → Company → Deal → Activity → Quote → Invoice → Payment → Report
```

Every feature includes: business rules, UI specification, UX flows, API contracts, database entities, permissions, validation, edge cases, and acceptance criteria.

**Audience:** Product, Engineering, Design, QA, Sales, Customer Success, Investors.

---

## Document Map

| Part | Title | Chapters | Est. Pages | Status |
|------|-------|----------|------------|--------|
| **Part 1** | [CRM Foundation](./part-01-foundation/README.md) | 6 | 22 | ✅ Complete |
| **Part 2** | [Lead Management](./part-02-leads/README.md) | 10 | 28 | ✅ Complete |
| **Part 3** | [Contacts & Companies](./part-03-contacts-companies/README.md) | 12 | 32 | ✅ Complete |
| **Part 4** | [Deal Pipeline](./part-04-deals/README.md) | 10 | 34 | ✅ Complete |
| **Part 5** | [Activities & Calendar](./part-05-activities/README.md) | 8 | 18 | ⚪ |
| **Part 6** | [Quotations](./part-06-quotations/README.md) | 8 | 20 | ⚪ |
| **Part 7** | [Invoices](./part-07-invoices/README.md) | 8 | 18 | ⚪ |
| **Part 8** | [Payments](./part-08-payments/README.md) | 7 | 16 | ⚪ |
| **Part 9** | [Reports & Analytics](./part-09-reports/README.md) | 8 | 18 | ⚪ |
| **Part 10** | [Automation & Workflows](./part-10-automation/README.md) | 8 | 16 | ⚪ |
| **Part 11** | [AI CRM Features](./part-11-ai-crm/README.md) | 6 | 12 | ⚪ |
| **Part 12** | [Technical Specifications](./part-12-technical/README.md) | 6 | 20 | ⚪ |

**Total:** ~232 pages equivalent across 93 chapters

---

## GTM & Commercial Documents

Sellable product ke liye CRM PRD ke saath ye documents bhi maintain honge:

| Document | Location | Purpose |
|----------|----------|---------|
| Feature Matrix | [../GTM/feature-matrix.md](../GTM/feature-matrix.md) | Starter vs Growth vs Enterprise |
| Pricing PRD | [../GTM/pricing-prd.md](../GTM/pricing-prd.md) | Packaging, limits, add-ons |
| Onboarding Flow | [../GTM/onboarding-flow.md](../GTM/onboarding-flow.md) | Tenant setup → first value |
| Trial Experience | [../GTM/trial-experience.md](../GTM/trial-experience.md) | 14-day trial UX |
| Landing Page Copy | [../GTM/landing-page-copy.md](../GTM/landing-page-copy.md) | Marketing website |
| Demo Data Pack | [../GTM/demo-data-pack.md](../GTM/demo-data-pack.md) | Sales demo seed data |
| Sales Deck Outline | [../GTM/sales-deck-outline.md](../GTM/sales-deck-outline.md) | B2B sales presentation |
| Investor Pitch | [../GTM/investor-pitch-outline.md](../GTM/investor-pitch-outline.md) | Fundraising narrative |
| Customer Success Flow | [../GTM/customer-success-flow.md](../GTM/customer-success-flow.md) | Post-sale adoption |
| Knowledge Base Structure | [../GTM/knowledge-base-structure.md](../GTM/knowledge-base-structure.md) | Help center IA |

---

## Core CRM Entities

```
Tenant
  └── Pipeline (1..n)
        └── Stage (ordered)
  └── Lead ──convert──► Contact + Company + Deal
  └── Contact ◄──► Company (many-to-many via roles)
  └── Deal ──► Quotation ──► Invoice ──► Payment
  └── Activity (polymorphic: Lead|Contact|Company|Deal)
  └── Product / LineItem (shared with Quotes & Invoices)
```

---

## Migration from Current Codebase

| Current | Target | Action |
|---------|--------|--------|
| `Client` model (MongoDB) | `Lead`, `Contact`, `Company` entities | Split + migrate data |
| `/crm` → Clients page | Full CRM nav (Part 1 §5) | Replace with module IA |
| `Client.status: Lead/Active/Inactive` | Lead status + Contact lifecycle | Map on migration |

---

## Writing Order (This Book)

1. ✅ Part 1 — CRM Foundation
2. ✅ Part 2 — Lead Management
3. ✅ Part 3 — Contacts & Companies
4. ✅ Part 4 — Deal Pipeline
5. Part 5 — Activities & Calendar
6. Part 7 — Invoices
7. Part 8 — Payments
8. Part 5 — Activities
9. Part 9 — Reports
10. Part 10 — Automation
11. Part 11 — AI CRM
12. Part 12 — Technical Specs (consolidated schema + APIs)

---

## Revision Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-draft | Jul 2026 | Book 2 initiated — Part 1, Part 2, GTM docs |
| 1.1.0-draft | Jul 2026 | Part 3 Contacts & Companies complete (12 chapters) |
| 1.2.0-draft | Jul 2026 | Part 4 Deal Pipeline complete — Zoho-inspired UX spec |
