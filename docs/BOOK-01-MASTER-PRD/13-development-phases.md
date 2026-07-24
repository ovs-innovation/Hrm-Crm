# Chapter 13 — Development Phases & Roadmap

**Book:** 1 — Master PRD  
**Chapter:** 13 of 13  
**Version:** 1.0.0-draft

---

## 13.1 Phase Overview

```
Phase 0 (Done)     Phase 1 (MVP)       Phase 2 (Growth)      Phase 3 (Scale)
Foundation    →    Commercial Launch  →  Full Platform     →  Enterprise
~3 months          ~4 months             ~4 months             ~6 months
HRM + Basic        + CRM + SaaS          + Finance + AI        + Client Portal
                   + Multi-tenant        + Support             + Inventory
```

---

## 13.2 Phase 0 — Foundation (Current State)

**Status:** `[In Progress]` — ~60% complete

### Delivered

- [x] Admin Console app shell (sidebar, header, layout)
- [x] Employee Portal app shell
- [x] Vastora brand design tokens in CSS
- [x] Core UI components (Button, Input, Select, Modal, Card, Skeleton)
- [x] Authentication (login, signup, set password)
- [x] HRM: Employees, Departments, Designations
- [x] HRM: Attendance, Leave, Shift Roster, Holidays
- [x] HRM: Tasks, Appreciation, Announcements, Daily Reports
- [x] HRM: Payslips (basic)
- [x] Projects: List, basic tasks
- [x] CRM: Clients (basic)
- [x] Messenger (Socket.IO real-time chat)
- [x] Backend API: ~11 models, auth middleware
- [x] Book 1: Master PRD documentation

### Remaining in Phase 0

- [ ] Employee profile detail page
- [ ] Project kanban board
- [ ] Notification system
- [ ] Forgot/reset password flow
- [ ] Consistent table component across all list pages
- [ ] Breadcrumb component
- [ ] Empty states on all list pages

---

## 13.3 Phase 1 — MVP (Commercial Launch)

**Target:** 4 months from Phase 0 completion  
**Goal:** First paying customers on Growth tier

### Sprint Breakdown

#### Sprint 1 (2 weeks) — Platform Foundation

| Task | Priority | Owner |
|------|----------|-------|
| Multi-tenant architecture (tenant_id on all models) | P0 | Backend |
| RBAC middleware + permission checks | P0 | Backend |
| User invitation flow | P0 | Full-stack |
| Settings: Company profile, user management | P0 | Full-stack |
| Audit log service | P1 | Backend |
| Migrate MongoDB schema for tenant isolation | P0 | Backend |
| Shared Table, Breadcrumb, EmptyState components | P0 | Frontend |
| Forgot/reset password | P0 | Full-stack |

**Exit criteria:** Two tenants can coexist with isolated data. Admin can invite users with roles.

#### Sprint 2 (2 weeks) — CRM Core

| Task | Priority | Owner |
|------|----------|-------|
| Lead CRUD + list + detail | P0 | Full-stack |
| Contact CRUD + list + detail | P0 | Full-stack |
| Company CRUD + list + detail | P0 | Full-stack |
| Deal CRUD + pipeline board view | P0 | Full-stack |
| Deal stages + pipeline configuration | P0 | Full-stack |
| Activity log on deal/contact | P0 | Full-stack |
| CRM Dashboard (pipeline metrics) | P1 | Frontend |

**Exit criteria:** Sales rep can create lead → convert to deal → move through pipeline stages.

#### Sprint 3 (2 weeks) — CRM Revenue Flow

| Task | Priority | Owner |
|------|----------|-------|
| Quotation builder (line items, taxes) | P0 | Full-stack |
| Invoice generation from quotation/deal | P0 | Full-stack |
| Invoice PDF generation | P0 | Backend |
| Payment recording + reconciliation | P0 | Full-stack |
| Deal → Project auto-creation on win | P1 | Backend |
| CRM Reports (pipeline, conversion) | P1 | Full-stack |

**Exit criteria:** Full Lead → Deal → Quote → Invoice → Payment flow works end-to-end.

#### Sprint 4 (2 weeks) — HRM Completion + SaaS Billing

| Task | Priority | Owner |
|------|----------|-------|
| Employee profile detail page (tabs) | P0 | Frontend |
| Leave approval workflow polish | P0 | Full-stack |
| Payroll processing (basic) | P1 | Full-stack |
| SaaS billing integration (Razorpay/Stripe) | P0 | Backend |
| Subscription tiers + usage limits | P0 | Backend |
| Trial flow (14-day, auto-provision) | P0 | Full-stack |
| Onboarding wizard | P0 | Frontend |

**Exit criteria:** New tenant can sign up, trial, convert to paid. HR module production-ready.

#### Sprint 5 (2 weeks) — Projects + Dashboards

| Task | Priority | Owner |
|------|----------|-------|
| Project kanban board (drag-drop) | P0 | Frontend |
| Task detail + assignment + comments | P0 | Full-stack |
| Time tracking (log hours against tasks) | P0 | Full-stack |
| CEO Dashboard (metrics from CRM + HRM) | P0 | Frontend |
| Sales Dashboard | P1 | Frontend |
| HR Dashboard | P1 | Frontend |
| Employee Dashboard polish | P0 | Frontend |

**Exit criteria:** Project manager can run kanban board. CEO sees unified dashboard.

#### Sprint 6 (2 weeks) — Polish, Security & Launch Prep

| Task | Priority | Owner |
|------|----------|-------|
| 2FA (TOTP) implementation | P0 | Full-stack |
| Global search (basic) | P1 | Full-stack |
| Email notifications (transactional) | P0 | Backend |
| Data import (CSV — employees, contacts, leads) | P0 | Full-stack |
| Mobile responsive pass (all MVP screens) | P0 | Frontend |
| Performance optimization (API < 200ms p95) | P0 | Backend |
| Security audit + penetration test | P0 | External |
| QA regression suite | P0 | QA |
| Production deployment (Docker + CI/CD) | P0 | DevOps |
| Terms of Service + Privacy Policy | P0 | Legal |

**Exit criteria:** Production deployment live. First 5 beta customers onboarded.

---

## 13.4 Phase 2 — Growth (Post-MVP)

**Target:** 4 months after MVP launch  
**Goal:** 30+ paying tenants, full module coverage

### Key Deliverables

| Module | Features |
|--------|----------|
| **Finance** | Income, expenses, vendors, GST reports |
| **Support** | Ticket system, SLA management |
| **AI** | Email writer, lead analysis, AI assistant panel |
| **Projects** | Sprint view, Gantt timeline, bug tracker |
| **HRM** | Recruitment pipeline, performance reviews, employee documents |
| **Platform** | Command palette, calendar sync, email integration |
| **Client Portal** | Project view, invoices, tickets for external clients |

### Sprint Overview (Phase 2)

| Sprint | Focus |
|--------|-------|
| Sprint 7–8 | Finance module |
| Sprint 9–10 | Support + AI core |
| Sprint 11–12 | Client Portal + Recruitment |
| Sprint 13–14 | Advanced projects (Sprint, Gantt) + Performance reviews |
| Sprint 15–16 | Integrations (Email, Calendar, WhatsApp) + Polish |

---

## 13.5 Phase 3 — Scale (Enterprise)

**Target:** 6 months after Phase 2  
**Goal:** Enterprise tier customers, 100+ tenants

| Feature | Description |
|---------|-------------|
| SSO (SAML/OIDC) | Enterprise single sign-on |
| Custom roles (advanced) | Field-level permissions |
| Inventory module | Stock management `[Future]` |
| Advanced analytics | Custom report builder, BI dashboards |
| WhatsApp Business API | Native messaging integration |
| Meeting AI | Transcription + summary |
| Resume parser | Recruitment AI |
| SOC 2 / GDPR compliance | Enterprise trust |
| Self-hosted deployment option | On-premise for regulated industries |
| Marketplace / API ecosystem | Third-party integrations |

---

## 13.6 Technology Migration Plan

Current codebase uses MongoDB + JavaScript. Target stack per architecture books:

| Component | Current | Target | Migration Sprint |
|-----------|---------|--------|------------------|
| Database | MongoDB | PostgreSQL | Sprint 1 (Phase 1) |
| Language | JavaScript | TypeScript | Gradual, Phase 1–2 |
| Cache | None | Redis | Sprint 1 (Phase 1) |
| Job Queue | None | BullMQ | Sprint 3 (Phase 1) |
| File Storage | Local | S3 | Sprint 4 (Phase 1) |
| State Management | Redux | TanStack Query + Zustand | Phase 1–2 |
| Testing | None | Vitest + Playwright | Sprint 6 (Phase 1) |

**Migration strategy:** New modules built on PostgreSQL. Existing MongoDB data migrated module-by-module with dual-write period.

---

## 13.7 Team Structure (Recommended)

| Role | Count | Phase 1 | Phase 2 |
|------|-------|---------|---------|
| Product Owner | 1 | ✅ | ✅ |
| UI/UX Designer | 1 | ✅ | ✅ |
| Frontend Developer | 2 | ✅ | 2–3 |
| Backend Developer | 2 | ✅ | 2–3 |
| Full-Stack Developer | 1 | ✅ | ✅ |
| QA Engineer | 1 | Sprint 5+ | ✅ |
| DevOps Engineer | 1 | Sprint 6 | ✅ |
| **Total** | **8–9** | **6–7** | **8–9** |

---

## 13.8 MVP Definition of Done

The MVP is ready for commercial launch when ALL of the following are true:

### Functional

- [ ] Multi-tenant: 10+ tenants with isolated data
- [ ] CRM: Lead → Deal → Quote → Invoice → Payment flow complete
- [ ] HRM: Employee lifecycle (hire → attend → leave → payslip) complete
- [ ] Projects: Kanban + tasks + time tracking functional
- [ ] RBAC: 6+ system roles with permission enforcement
- [ ] Billing: Trial → paid conversion with Razorpay/Stripe
- [ ] Auth: Login, signup, invite, 2FA, password reset

### Non-Functional

- [ ] API response time < 200ms (p95) for CRUD operations
- [ ] Page load < 2.5s (LCP) on 4G connection
- [ ] 99.5% uptime SLA
- [ ] Zero critical security vulnerabilities
- [ ] Mobile responsive on all MVP screens
- [ ] Data backup: daily automated, 30-day retention

### Business

- [ ] 5 beta customers actively using the product
- [ ] Terms of Service and Privacy Policy published
- [ ] Support email operational
- [ ] Onboarding documentation for customers
- [ ] Pricing page live

---

## 13.9 Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| MongoDB → PostgreSQL migration delays launch | High | Medium | Start migration Sprint 1; dual-write strategy |
| CRM module scope creep | High | High | Strict MVP cut line; defer Reports Builder to P2 |
| Solo/small team bandwidth | High | Medium | Phase 1 focused on 3 modules only |
| Zoho/HubSpot price war | Medium | Low | Differentiate on unified UX + AI + India-first |
| Security breach pre-launch | Critical | Low | Pen test in Sprint 6; audit logs from Sprint 1 |
| Low trial-to-paid conversion | High | Medium | Onboarding wizard + Day 3/7/12 email sequence |

---

## 13.10 Documentation Roadmap

Aligned with product development phases:

| Book | Target Completion | Depends On |
|------|-------------------|------------|
| Book 1 — Master PRD | ✅ Phase 0 | — |
| Design System (extended) | Sprint 1 | Book 1 |
| Book 2 — CRM PRD | Sprint 1 | Book 1 |
| Book 3 — HRM PRD | Sprint 2 | Book 1 |
| Book 4 — Projects PRD | Sprint 3 | Book 1 |
| Book 7 — Architecture | Sprint 1 | Book 1 |
| Book 8 — Database | Sprint 1 | Book 7 |
| Book 9 — APIs | Sprint 2 | Book 8 |
| Book 5 — Finance PRD | Phase 2 start | Book 1 |
| Book 6 — AI PRD | Phase 2 start | Book 1 |
| Book 10 — Deployment | Sprint 6 | Book 7 |
| Book 11 — QA | Sprint 5 | Books 2–4 |
| Book 12 — Roadmap (detailed sprints) | Sprint 1 | Book 1 |

**Rule:** No sprint starts without its module PRD and API spec complete.

---

## 13.11 Success Criteria by Phase

| Phase | Metric | Target |
|-------|--------|--------|
| Phase 0 | Documentation + foundation code | Book 1 complete, 33 screens built |
| Phase 1 (MVP) | Paying tenants | 5–10 |
| Phase 1 (MVP) | MVP screens | 75 screens complete |
| Phase 2 | Paying tenants | 30–50 |
| Phase 2 | MRR | ₹10L+ |
| Phase 3 | Paying tenants | 100+ |
| Phase 3 | Enterprise customers | 5+ |
| Phase 3 | ARR | ₹2.7Cr+ |

---

## 13.12 Immediate Next Steps

1. **Review & approve Book 1** — Stakeholder sign-off on vision, modules, roles, phases
2. **Book 2 — CRM PRD** — Detailed spec for every CRM screen, API, and database entity
3. **Book 7 — Architecture** — Multi-tenant design, PostgreSQL schema strategy
4. **Design System expansion** — Figma component library from Book 1 tokens
5. **Sprint 1 planning** — Break Sprint 1 tasks into tickets with acceptance criteria

---

**Previous:** [12 — Screen Inventory](./12-screen-inventory.md)  
**Book 1 Complete.** Proceed to [Book 2 — CRM PRD](../../BOOK-02-CRM/README.md)
