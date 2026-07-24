# Chapter 1 — Executive Summary

**Book:** 1 — Master PRD  
**Chapter:** 1 of 13  
**Version:** 1.0.0-draft

---

## 1.1 Product at a Glance

| Attribute | Value |
|-----------|-------|
| **Product Name** | Vastora CRM |
| **Platform Name** | Vastora One |
| **Category** | AI-Powered Business Operating System |
| **Tagline** | One Platform. Every Business. |
| **Target Market** | SMEs, agencies, IT companies, hospitals, real estate, manufacturing (10–1,000 employees) |
| **Deployment** | Multi-tenant SaaS (cloud-first, self-hosted enterprise option `[Future]`) |
| **Primary Surfaces** | Admin Console, Employee Portal, Client Portal `[P1]`, Mobile Web `[P1]` |

---

## 1.2 The Problem

Modern businesses run on fragmented software:

- CRM in one tool (HubSpot, Zoho)
- HR in another (Keka, BambooHR)
- Projects in Jira or Asana
- Finance in Tally or QuickBooks
- Support in Freshdesk or Zendesk

This fragmentation creates:

1. **Data silos** — Sales doesn't see project status; HR doesn't see billing.
2. **Duplicate entry** — Same client exists in CRM, projects, and invoicing with different spellings.
3. **Permission chaos** — No unified RBAC across systems.
4. **High total cost** — 5–8 subscriptions per company.
5. **Poor employee experience** — Staff juggle 6+ logins daily.

---

## 1.3 The Solution

**Vastora One** unifies CRM, HRM, Projects, Finance, Support, and AI into a single platform with:

- One login, one data model, one permission system
- Role-based dashboards (CEO, Sales, HR, Manager, Employee, Client)
- End-to-end business flows: Lead → Deal → Project → Invoice → Payment
- AI assistants embedded in workflows (not bolted on)
- Enterprise-grade security: RBAC, 2FA, audit logs, tenant isolation

---

## 1.4 Product Positioning Statement

> For growing businesses that outgrow spreadsheets and disconnected SaaS tools, **Vastora CRM** is an **AI-powered business operating system** that unifies sales, people, projects, and finance in one platform — unlike point solutions that force teams to sync data manually, Vastora provides **one source of truth** with **role-aware workflows** and **modern enterprise UX**.

---

## 1.5 What Vastora Is — and Is Not

### Vastora IS

- A unified BOS (Business Operating System) for 10–1,000 employee organizations
- A sellable, multi-tenant SaaS product with subscription billing
- Desktop-first, responsive, fast (< 200ms perceived interactions)
- Inspired by best-in-class UX patterns (density, clarity, speed)
- AI-augmented at every workflow touchpoint

### Vastora IS NOT

- A Zoho, HubSpot, or ERPNext clone or white-label
- An ERP replacement for large manufacturing enterprises `[Future inventory may extend scope]`
- A single-module tool (CRM-only or HR-only SKU is a packaging tier, not the product identity)
- A no-code platform `[Future]` — it is opinionated, structured business software

---

## 1.6 Current Codebase Status

As of July 2026, the repository contains an **early foundation**:

| Layer | Status |
|-------|----------|
| **Admin Console** | `[Built]` — HRM-heavy, basic CRM (Clients), Projects, Messenger |
| **Employee Portal** | `[Built]` — Attendance, Leaves, Tasks, Payslips, Management views |
| **Backend API** | `[Partial]` — Node/Express, MongoDB, ~11 models, Socket.IO messenger |
| **Design Tokens** | `[Built]` — Vastora brand colors, Inter typography in CSS |
| **Multi-tenant SaaS** | `[Future]` — Not yet implemented |
| **CRM Pipeline** | `[Future]` — Leads, Deals, Quotes, Invoices not built |
| **PostgreSQL / Redis / BullMQ** | `[Future]` — Target stack per architecture books |

Book 1 defines the **target state**. Books 7–12 define migration from current foundation to target.

---

## 1.7 Success Metrics (Year 1)

| Metric | Target |
|--------|--------|
| Paying tenants | 50 |
| Monthly Active Users (MAU) | 2,500 |
| Net Revenue Retention | > 110% |
| Time to first value (signup → first lead/deal) | < 15 minutes |
| Core Web Vitals (LCP) | < 2.5s |
| Support ticket resolution (P1 bugs) | < 48 hours |
| NPS (admin users) | > 40 |

---

## 1.8 Key Decisions Locked in Book 1

These decisions are **binding** for all downstream books unless formally revised:

1. **Product identity:** Vastora One — unified BOS, not "another CRM"
2. **Brand colors:** Primary `#296CB2`, Dark `#273850`, Canvas `#F8FBFF`
3. **Typography:** Inter (UI), IBM Plex Sans (numeric/data) `[P1 implementation]`
4. **Spacing:** 8pt grid system
5. **Border radius:** 12px default (16px panels, 24px modals)
6. **Animation:** Framer Motion, 150–250ms, no flashy transitions
7. **Design inspiration:** Density (Zoho), workflows (HubSpot), interactions (Linear), minimalism (Notion), nav (Slack), analytics (Stripe)
8. **Multi-tenant SaaS** with RBAC from day one of commercial launch
9. **Three primary apps:** Admin Console, Employee Portal, Client Portal
10. **Documentation-first** for all new modules post Book 1

---

## 1.9 Document Map

After Book 1, the following books expand each domain:

```
Book 1 (Master PRD) ──► Books 2–6 (Module PRDs)
                     ──► Books 7–9 (Architecture, DB, APIs)
                     ──► Books 10–12 (Deploy, QA, Roadmap)
```

No module ships to production without its module PRD (Books 2–6) and corresponding API/DB specs (Books 8–9).

---

## 1.10 Approval & Sign-off

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Owner | — | Draft | — |
| Engineering Lead | — | Pending | — |
| Design Lead | — | Pending | — |
| QA Lead | — | Pending | — |

---

**Next Chapter:** [02 — Product Vision & Mission](./02-vision-and-mission.md)
