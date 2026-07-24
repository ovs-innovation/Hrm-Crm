# Part 3 — Contacts & Companies

**Book:** 2 — CRM Module PRD  
**Part:** 3 of 12  
**Est. Pages:** 32  
**Status:** ✅ Complete

---

## Purpose

Contacts and Companies are the **persistent customer identity layer** of Vastora CRM. Every Deal, Quotation, Invoice, Project, and Support Ticket attaches to these entities. This part must be locked before Part 4 (Deals) to avoid downstream refactors.

**Enterprise pattern:** Salesforce Account/Contact, HubSpot Company/Contact, Dynamics Account/Contact.

---

## Chapters

| # | Chapter | File | Status |
|---|---------|------|--------|
| 1 | Contact & Company Overview | [01-contact-overview.md](./01-contact-overview.md) | ✅ |
| 2 | Contact Data Model | [02-contact-data-model.md](./02-contact-data-model.md) | ✅ |
| 3 | Company Data Model | [03-company-data-model.md](./03-company-data-model.md) | ✅ |
| 4 | Contact List UI | [04-contact-list-ui.md](./04-contact-list-ui.md) | ✅ |
| 5 | Contact Profile 360 | [05-contact-profile-360.md](./05-contact-profile-360.md) | ✅ |
| 6 | Company Profile 360 | [06-company-profile-360.md](./06-company-profile-360.md) | ✅ |
| 7 | Contact–Company Relationships | [07-contact-company-relationships.md](./07-contact-company-relationships.md) | ✅ |
| 8 | Import, Export & Deduplication | [08-import-export-deduplication.md](./08-import-export-deduplication.md) | ✅ |
| 9 | Segmentation & Tags | [09-contact-segmentation-tags.md](./09-contact-segmentation-tags.md) | ✅ |
| 10 | Unified Timeline | [10-contact-timeline.md](./10-contact-timeline.md) | ✅ |
| 11 | Communication Center | [11-contact-communication-center.md](./11-contact-communication-center.md) | ✅ |
| 12 | Technical Spec & Acceptance | [12-contact-technical-spec.md](./12-contact-technical-spec.md) | ✅ |

---

## Mandatory Sections (All Parts Going Forward)

Every chapter in Book 2+ includes where applicable:

- **Tenant Scope** — multi-tenant isolation rules
- **Permissions** — RBAC requirements
- **Audit Log** — tracked events
- **UI Flow** — step-by-step UX
- **Responsive** — Desktop / Tablet / Mobile
- **API Contract** — endpoints and payloads
- **Database** — tables, indexes, ERD fragments
- **Acceptance Criteria** — sign-off checklist

---

**Previous Part:** [Part 2 — Lead Management](../part-02-leads/README.md)  
**Next Part:** [Part 4 — Deal Pipeline](../part-04-deals/README.md)
