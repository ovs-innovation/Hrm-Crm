# Chapter 1 — CRM Module Overview

**Book:** 2 — CRM PRD · **Part:** 1 — Foundation · **Chapter:** 1  
**Version:** 1.0.0-draft

---

## 1.1 Module Definition

The **Vastora CRM module** manages the complete **revenue lifecycle** — from first prospect touch to collected payment and repeat business. It is the primary selling surface of Vastora One and the first module most Growth-tier customers adopt.

### Scope Boundary

| In Scope | Out of Scope (Other Modules) |
|----------|------------------------------|
| Lead capture, qualification, conversion | Employee payroll (HRM) |
| Contact & company management | Project delivery (Projects) |
| Deal pipeline & forecasting | Statutory accounting (Finance) |
| Sales activities (calls, meetings, emails) | Support tickets (Support) |
| Quotations, invoices, payment recording | Inventory & stock `[Future]` |
| Sales reports & team performance | Marketing automation (email campaigns) `[P2]` |

---

## 1.2 Business Problem CRM Solves

| Problem | Vastora CRM Solution |
|---------|---------------------|
| Leads lost in spreadsheets/email | Centralized lead inbox with assignment rules |
| No visibility into pipeline | Kanban + table pipeline with stage metrics |
| Quotes created manually in Word | Quote builder linked to deal line items |
| Invoices disconnected from CRM | One-click invoice from won deal/quote |
| Sales manager can't forecast | Weighted pipeline + forecast reports |
| Reps don't know next action | Activity timeline + AI next-action suggestions `[P1]` |
| Duplicate contacts everywhere | Duplicate detection on email/phone/GSTIN |

---

## 1.3 End-to-End Revenue Workflow

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│  LEAD   │───►│ CONTACT  │───►│  DEAL   │───►│  QUOTE   │
│ Capture │    │ + Company│    │ Pipeline│    │ Builder  │
└─────────┘    └──────────┘    └────┬────┘    └────┬─────┘
                                    │ Win           │
                                    ▼               ▼
                              ┌──────────┐    ┌──────────┐
                              │ PROJECT  │    │ INVOICE  │
                              │ (Book 4) │    │ + GST    │
                              └──────────┘    └────┬─────┘
                                                   │
                                                   ▼
                                             ┌──────────┐
                                             │ PAYMENT  │
                                             │ Razorpay │
                                             └──────────┘
```

### Workflow Rules (Global)

1. A **Lead** converts to **Contact** + optional **Company** + optional **Deal**
2. A **Deal** must link to at least one Contact; Company is recommended
3. A **Quotation** must link to a Deal (or standalone for existing clients `[P1]`)
4. An **Invoice** can be generated from Quotation or Deal directly
5. A **Payment** must link to an Invoice
6. **Deal Won** triggers: optional Project creation, optional Invoice draft, activity log entry

---

## 1.4 CRM Sub-Modules

| Sub-Module | Part | MVP | Description |
|------------|------|-----|-------------|
| CRM Dashboard | Part 1 | ✅ | KPIs, pipeline snapshot, activity feed |
| Leads | Part 2 | ✅ | Capture, assign, qualify, convert |
| Contacts | Part 3 | ✅ | People records, communication history |
| Companies | Part 3 | ✅ | Account/organization records |
| Deals & Pipeline | Part 4 | ✅ | Kanban, stages, forecast |
| Activities | Part 5 | ✅ | Calls, meetings, emails, tasks |
| Calendar | Part 5 | P1 | Team calendar, meeting scheduler |
| Quotations | Part 6 | ✅ | Quote builder, PDF, approval |
| Invoices | Part 7 | ✅ | Invoice gen, GST, credit notes |
| Payments | Part 8 | ✅ | Online + offline, receipts |
| Reports | Part 9 | ✅ | Funnel, revenue, team performance |
| Automation | Part 10 | P1 | Assignment rules, workflows |
| AI CRM | Part 11 | P1 | Scoring, drafting, predictions |

---

## 1.5 Entity Relationship (Logical)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Lead     │──────►│   Contact   │◄─────►│   Company   │
└─────────────┘ convert└──────┬──────┘  M:N  └──────┬──────┘
                              │                     │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │        Deal         │
                              │  (belongs to Pipeline │
                              │   + Stage)            │
                              └──────────┬──────────┘
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
             ┌───────────┐       ┌───────────┐       ┌───────────┐
             │ Quotation │──────►│  Invoice  │──────►│  Payment  │
             └───────────┘       └───────────┘       └───────────┘
                    │
                    ▼
             ┌───────────┐
             │ LineItem  │◄──── Product (catalog)
             └───────────┘

Activity ──polymorphic──► Lead | Contact | Company | Deal | Quotation | Invoice
Document ──polymorphic──► (same entities)
Note     ──polymorphic──► (same entities)
```

---

## 1.6 Integration Points

| System | Direction | Use Case |
|--------|-----------|----------|
| **Projects** | Deal Won → Create Project | Delivery starts automatically |
| **Finance** | Invoice Paid → Income record | Revenue in finance dashboard |
| **HRM** | User ↔ Employee link | Deal owner = sales employee |
| **Support** | Company → Tickets | Client support context |
| **Client Portal** | Contact → Portal user | Client sees projects/invoices |
| **Email (SMTP/Gmail)** | Bidirectional | Log emails as activities |
| **WhatsApp Business** | Outbound | Quote/invoice reminders `[P1]` |
| **Razorpay / Stripe** | Inbound webhooks | Payment status sync |
| **Calendar (Google/Outlook)** | Bidirectional | Meeting sync `[P1]` |

---

## 1.7 Current State vs Target

| Capability | Current (`Client` model) | Target (Book 2) |
|------------|-------------------------|-----------------|
| Data model | Single `Client` entity | Lead, Contact, Company, Deal, etc. |
| Lead capture | Manual form only | Web form, CSV, API, email parse `[P1]` |
| Pipeline | Status field (Lead/Active/Inactive) | Multi-pipeline Kanban with stages |
| Quotes | None | Full quote builder |
| Invoices | Payslip only (HRM) | CRM invoices with GST |
| Payments | None | Razorpay + offline |
| Activities | Notes field only | Full activity timeline |
| Permissions | None (all admins) | CRM RBAC matrix |
| Multi-tenant | None | `tenant_id` on all records |

**Migration path:** Existing `Client` records where `status = 'Lead'` → `Lead` entity. Where `status = 'Active'` → `Contact` + `Company`. Documented in Part 12.

---

## 1.8 Non-Functional Requirements (CRM-Specific)

| Requirement | Target |
|-------------|--------|
| Lead list load (1,000 records) | < 500ms API, < 1s render with pagination |
| Pipeline board (100 deals) | < 800ms load, 60fps drag-drop |
| Quote PDF generation | < 3 seconds |
| Invoice PDF generation | < 3 seconds |
| Duplicate check on create | < 200ms |
| Search across CRM entities | < 300ms `[P1]` |
| Concurrent deal updates | Optimistic locking — no lost stage changes |
| Audit | All deal stage changes, quote approvals, invoice voids logged |

---

## 1.9 Module Enablement

CRM is available on **Growth** and **Enterprise** tiers only (see [GTM Feature Matrix](../../GTM/feature-matrix.md)).

When disabled for a tenant:
- CRM nav hidden
- CRM API returns `403 MODULE_DISABLED`
- Existing CRM data preserved (not deleted)

---

**Next:** [02 — Business Goals & Success Metrics](./02-business-goals.md)
