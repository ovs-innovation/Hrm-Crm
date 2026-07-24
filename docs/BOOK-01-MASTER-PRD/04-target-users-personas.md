# Chapter 4 — Target Users & Personas

**Book:** 1 — Master PRD  
**Chapter:** 4 of 13  
**Version:** 1.0.0-draft

---

## 4.1 Ideal Customer Profile (ICP)

### Primary ICP

| Attribute | Definition |
|-----------|------------|
| **Company size** | 10–1,000 employees |
| **Revenue** | ₹1 Cr – ₹500 Cr / $150K – $50M ARR |
| **Geography** | India-first, English UI; global expansion `[P2]` |
| **Tech maturity** | Outgrown spreadsheets; frustrated with 3+ disconnected SaaS tools |
| **Decision maker** | Founder, CEO, COO, or IT Head |
| **Budget** | ₹15,000 – ₹2,00,000/month for business software |

### Industry Verticals (Priority Order)

| Priority | Industry | Key Modules Used |
|----------|----------|------------------|
| 1 | IT Services & Agencies | CRM, Projects, HRM, Finance |
| 2 | Professional Services | CRM, Projects, Finance |
| 3 | Real Estate | CRM, Finance, Documents |
| 4 | Healthcare (Hospitals/Clinics) | HRM, Finance, Support |
| 5 | Manufacturing (SME) | HRM, Finance, Projects, Inventory `[Future]` |
| 6 | Retail & D2C | CRM, Finance, Support |

---

## 4.2 Anti-ICP (Who We Don't Target Initially)

| Segment | Reason |
|---------|--------|
| Solo freelancers (1 person) | Overkill; use simpler tools |
| Enterprise 5,000+ employees | Need SAP/Oracle-level ERP; long sales cycle |
| Companies needing only CRM | Can buy HubSpot; our value is unification |
| Highly regulated banks/insurance | Compliance scope too large for Year 1 |

---

## 4.3 User Segments

```
                    ┌─────────────────┐
                    │  Platform Admin  │  (Vastora internal — super admin)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Tenant Admin    │  (Company owner / IT admin)
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │  Managers    │   │  Staff       │   │  Clients     │
   │  (Dept heads)│   │  (Employees) │   │  (External)  │
   └─────────────┘   └─────────────┘   └─────────────┘
```

---

## 4.4 Persona 1 — Rajesh (CEO / Founder)

| Attribute | Detail |
|-----------|--------|
| **Age** | 38 |
| **Company** | 85-person IT services firm, Pune |
| **Role** | Founder & CEO |
| **Apps used today** | Zoho CRM, Excel, WhatsApp, Tally, Keka HR |
| **Pain points** | No single view of revenue + headcount + project delivery; board reports take 2 days to compile |
| **Goals** | One dashboard for business health; reduce software spend; scale to 150 people without chaos |
| **Vastora surfaces** | Admin Console → CEO Dashboard |
| **Key features** | Pipeline summary, revenue vs target, headcount, project profitability, cash flow snapshot |
| **Success quote** | *"I open Vastora every morning instead of five tabs."* |

---

## 4.5 Persona 2 — Priya (Sales Manager)

| Attribute | Detail |
|-----------|--------|
| **Age** | 32 |
| **Company** | Same IT firm |
| **Role** | Head of Sales |
| **Team** | 8 sales reps |
| **Pain points** | Leads in CRM, quotes in Word, invoices in Tally — data never matches; can't forecast accurately |
| **Goals** | Lead → Deal → Quote → Invoice in one flow; activity tracking; team performance visibility |
| **Vastora surfaces** | Admin Console → CRM module, Sales Dashboard |
| **Key features** | Pipeline board, deal stages, quotations, activity log, sales reports, AI email writer |
| **Success quote** | *"I closed a deal and the project was created automatically."* |

---

## 4.6 Persona 3 — Ankit (HR Manager)

| Attribute | Detail |
|-----------|--------|
| **Age** | 35 |
| **Company** | 200-bed multi-specialty hospital, Jaipur |
| **Role** | HR Manager |
| **Team** | 2 HR executives |
| **Pain points** | Attendance machine data doesn't sync with payroll; leave approvals on paper; recruitment in email |
| **Goals** | Digital employee lifecycle; automated payroll inputs; compliance-ready records |
| **Vastora surfaces** | Admin Console → HRM module, HR Dashboard |
| **Key features** | Employee records, attendance, leave workflows, payroll, recruitment, documents |
| **Success quote** | *"Payroll prep went from 3 days to 4 hours."* |

---

## 4.7 Persona 4 — Sneha (Project Manager)

| Attribute | Detail |
|-----------|--------|
| **Age** | 29 |
| **Company** | Digital agency, 40 people, Bangalore |
| **Role** | Project Manager |
| **Pain points** | Jira for dev, Asana for clients, time sheets in Google Sheets; billing disputes monthly |
| **Goals** | Kanban + timeline + time tracking linked to client projects and invoices |
| **Vastora surfaces** | Admin Console → Projects module |
| **Key features** | Kanban board, sprint view, task assignment, time logs, bug tracker, project reports |
| **Success quote** | *"Billable hours flow straight to the invoice."* |

---

## 4.8 Persona 5 — Vikram (Employee)

| Attribute | Detail |
|-----------|--------|
| **Age** | 27 |
| **Company** | IT services firm |
| **Role** | Software Developer |
| **Pain points** | HR portal is clunky; leave requests get lost; payslips in email attachments |
| **Goals** | Quick attendance, easy leave apply, visible tasks, downloadable payslips |
| **Vastora surfaces** | Employee Portal |
| **Key features** | Clock in/out, leave calendar, task list, payslips, announcements, messenger |
| **Success quote** | *"Applied for leave in 30 seconds from my phone."* |

---

## 4.9 Persona 6 — Meera (Finance Manager)

| Attribute | Detail |
|-----------|--------|
| **Age** | 41 |
| **Company** | Real estate developer, 120 employees |
| **Role** | Finance Head |
| **Pain points** | Invoices in one system, expenses in Excel, GST filing manual reconciliation |
| **Goals** | Income/expense tracking, vendor management, GST reports, linked to CRM invoices |
| **Vastora surfaces** | Admin Console → Finance module |
| **Key features** | Income, expenses, vendors, GST reports, payment reconciliation |
| **Success quote** | *"GST report is one click, not one week."* |

---

## 4.10 Persona 7 — Client User (External) `[P1]`

| Attribute | Detail |
|-----------|--------|
| **Name** | Arun (Client-side PM) |
| **Company** | External client of an agency using Vastora |
| **Role** | Client project coordinator |
| **Goals** | See project progress, approve deliverables, pay invoices, raise support tickets |
| **Vastora surfaces** | Client Portal |
| **Key features** | Project status, document sharing, invoices, ticket creation |

---

## 4.11 User Needs Matrix

| Need | Rajesh | Priya | Ankit | Sneha | Vikram | Meera | Client |
|------|--------|-------|-------|-------|--------|-------|--------|
| Unified dashboard | ● | ○ | ○ | ○ | ○ | ● | ○ |
| CRM pipeline | ○ | ● | ○ | ○ | ○ | ○ | ○ |
| Employee lifecycle | ○ | ○ | ● | ○ | ○ | ○ | ○ |
| Project management | ○ | ○ | ○ | ● | ○ | ○ | ● |
| Self-service HR | ○ | ○ | ○ | ○ | ● | ○ | ○ |
| Invoicing & finance | ● | ● | ○ | ● | ○ | ● | ● |
| AI assistance | ○ | ● | ○ | ○ | ○ | ○ | ○ |
| Mobile access | ○ | ● | ○ | ○ | ● | ○ | ○ |

● = Primary need | ○ = Secondary or not primary

---

## 4.12 Jobs-to-be-Done (JTBD)

| When... | I want to... | So I can... |
|---------|--------------|-------------|
| A new lead comes in | Capture and assign it instantly | Respond before competitors |
| A deal is closing | Generate a quote from deal data | Send proposal same day |
| A deal is won | Auto-create project and invoice schedule | Start delivery without admin delay |
| An employee joins | Run onboarding checklist | They are productive in week 1 |
| Month end arrives | Run payroll with attendance data | Pay accurately on time |
| A client asks for status | Show live project board | Avoid manual status emails |
| Board meeting is tomorrow | Pull CEO dashboard metrics | Present confidently in 5 minutes |

---

## 4.13 Onboarding Journey (New Tenant)

```
Sign Up → Verify Email → Company Setup (name, industry, size)
    → Invite Team → Choose Modules → Import Data (optional)
    → Guided Tour → First Action (create lead OR add employee)
    → Dashboard (role-based)
```

**Time to first value target:** < 15 minutes from signup to first meaningful record.

---

**Previous:** [03 — Brand Identity](./03-brand-identity.md)  
**Next:** [05 — Competitive Landscape](./05-competitive-landscape.md)
