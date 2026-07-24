# Chapter 12 — Complete Screen Inventory

**Book:** 1 — Master PRD  
**Chapter:** 12 of 13  
**Version:** 1.0.0-draft

---

## 12.1 Overview

This chapter catalogs every screen in Vastora CRM. Total: **~128 screens** across all apps and modules.

### Legend

| Tag | Meaning |
|-----|---------|
| `[Built]` | Exists in codebase |
| `[Partial]` | Scaffold/placeholder |
| `[MVP]` | Required for commercial launch |
| `[P1]` | Phase 1 post-MVP |
| `[P2]` | Phase 2 |

---

## 12.2 Authentication & Onboarding (8 screens)

| # | Screen | App | Priority | Status |
|---|--------|-----|----------|--------|
| A01 | Login | All | `[MVP]` | `[Built]` |
| A02 | Sign Up (Tenant Registration) | Admin | `[MVP]` | `[Built]` |
| A03 | Set Password (Invite Flow) | All | `[MVP]` | `[Built]` |
| A04 | Forgot Password | All | `[MVP]` | `[Future]` |
| A05 | Reset Password | All | `[MVP]` | `[Future]` |
| A06 | Two-Factor Authentication Setup | Admin | `[MVP]` | `[Future]` |
| A07 | Two-Factor Authentication Verify | Admin | `[MVP]` | `[Future]` |
| A08 | Onboarding Wizard | Admin | `[MVP]` | `[Future]` |

---

## 12.3 Dashboards (6 screens)

| # | Screen | App | Priority | Status |
|---|--------|-----|----------|--------|
| D01 | CEO / Executive Dashboard | Admin | `[MVP]` | `[Partial]` |
| D02 | Sales Dashboard | Admin | `[MVP]` | `[Future]` |
| D03 | HR Dashboard | Admin | `[MVP]` | `[Partial]` |
| D04 | Manager Dashboard | Admin | `[P1]` | `[Future]` |
| D05 | Employee Dashboard | Employee | `[MVP]` | `[Built]` |
| D06 | Client Dashboard | Client | `[P1]` | `[Future]` |

---

## 12.4 CRM Module (22 screens)

| # | Screen | Priority | Status |
|---|--------|----------|--------|
| C01 | CRM Dashboard | `[MVP]` | `[Future]` |
| C02 | Lead List | `[MVP]` | `[Future]` |
| C03 | Lead Detail | `[MVP]` | `[Future]` |
| C04 | Create/Edit Lead | `[MVP]` | `[Future]` |
| C05 | Contact List | `[MVP]` | `[Future]` |
| C06 | Contact Detail | `[MVP]` | `[Future]` |
| C07 | Create/Edit Contact | `[MVP]` | `[Future]` |
| C08 | Company List | `[MVP]` | `[Future]` |
| C09 | Company Detail | `[MVP]` | `[Future]` |
| C10 | Create/Edit Company | `[MVP]` | `[Future]` |
| C11 | Deal Pipeline (Board View) | `[MVP]` | `[Future]` |
| C12 | Deal List (Table View) | `[MVP]` | `[Future]` |
| C13 | Deal Detail | `[MVP]` | `[Future]` |
| C14 | Create/Edit Deal | `[MVP]` | `[Future]` |
| C15 | Activity Log | `[MVP]` | `[Future]` |
| C16 | Calendar View | `[P1]` | `[Future]` |
| C17 | Meeting Detail | `[P1]` | `[Future]` |
| C18 | Quotation List | `[MVP]` | `[Future]` |
| C19 | Quotation Builder | `[MVP]` | `[Future]` |
| C20 | Invoice List | `[MVP]` | `[Future]` |
| C21 | Invoice Detail / PDF Preview | `[MVP]` | `[Future]` |
| C22 | Payment List & Recording | `[MVP]` | `[Future]` |
| — | Clients (legacy) | — | `[Built]` → migrate to C08/C09 |

---

## 12.5 HRM Module (28 screens)

| # | Screen | Priority | Status |
|---|--------|----------|--------|
| H01 | Employee List | `[MVP]` | `[Built]` |
| H02 | Employee Profile / Detail | `[MVP]` | `[Partial]` |
| H03 | Add/Edit Employee | `[MVP]` | `[Built]` |
| H04 | Department List | `[MVP]` | `[Built]` |
| H05 | Designation List | `[MVP]` | `[Built]` |
| H06 | Attendance Dashboard | `[MVP]` | `[Built]` |
| H07 | Attendance Report | `[MVP]` | `[Built]` |
| H08 | Leave List (Admin) | `[MVP]` | `[Built]` |
| H09 | Leave Calendar | `[MVP]` | `[Built]` |
| H10 | Leave Application (Employee) | `[MVP]` | `[Built]` |
| H11 | Leave Approval Detail | `[MVP]` | `[Built]` |
| H12 | Shift Roster | `[MVP]` | `[Built]` |
| H13 | Holiday Calendar | `[MVP]` | `[Built]` |
| H14 | Add/Edit Holiday | `[MVP]` | `[Built]` |
| H15 | Payroll Dashboard | `[P1]` | `[Partial]` |
| H16 | Payroll Run / Processing | `[P1]` | `[Future]` |
| H17 | Payslip View | `[MVP]` | `[Built]` |
| H18 | Payslip PDF | `[MVP]` | `[Built]` |
| H19 | Recruitment Dashboard | `[P1]` | `[Partial]` |
| H20 | Job Posting List | `[P1]` | `[Future]` |
| H21 | Applicant Pipeline | `[P1]` | `[Future]` |
| H22 | Performance Review List | `[P1]` | `[Partial]` |
| H23 | Performance Review Detail | `[P1]` | `[Future]` |
| H24 | Appreciation Wall | `[MVP]` | `[Built]` |
| H25 | Announcements List | `[MVP]` | `[Built]` |
| H26 | Daily Reports | `[MVP]` | `[Built]` |
| H27 | Core HR / Policies | `[P1]` | `[Partial]` |
| H28 | Employee Documents | `[P1]` | `[Future]` |

---

## 12.6 Projects Module (12 screens)

| # | Screen | Priority | Status |
|---|--------|----------|--------|
| P01 | Project List | `[MVP]` | `[Built]` |
| P02 | Project Detail | `[MVP]` | `[Partial]` |
| P03 | Create/Edit Project | `[MVP]` | `[Built]` |
| P04 | Kanban Board | `[MVP]` | `[Partial]` |
| P05 | Task List View | `[MVP]` | `[Built]` |
| P06 | Task Detail | `[MVP]` | `[Partial]` |
| P07 | Create/Edit Task | `[MVP]` | `[Built]` |
| P08 | Sprint Board | `[P1]` | `[Future]` |
| P09 | Timeline / Gantt | `[P1]` | `[Future]` |
| P10 | Bug Tracker | `[P1]` | `[Future]` |
| P11 | Time Tracking / Timesheet | `[MVP]` | `[Partial]` |
| P12 | Project Reports | `[P1]` | `[Future]` |

---

## 12.7 Finance Module (10 screens)

| # | Screen | Priority | Status |
|---|--------|----------|--------|
| F01 | Finance Dashboard | `[P1]` | `[Partial]` |
| F02 | Income List | `[P1]` | `[Future]` |
| F03 | Expense List | `[P1]` | `[Future]` |
| F04 | Create/Edit Expense | `[P1]` | `[Future]` |
| F05 | Vendor List | `[P1]` | `[Future]` |
| F06 | Vendor Detail | `[P1]` | `[Future]` |
| F07 | GST Report | `[P1]` | `[Future]` |
| F08 | P&L Report | `[P1]` | `[Future]` |
| F09 | Cash Flow Report | `[P2]` | `[Future]` |
| F10 | Bank Reconciliation | `[P2]` | `[Future]` |

---

## 12.8 Support Module (6 screens)

| # | Screen | Priority | Status |
|---|--------|----------|--------|
| S01 | Ticket List | `[P1]` | `[Future]` |
| S02 | Ticket Detail | `[P1]` | `[Future]` |
| S03 | Create Ticket | `[P1]` | `[Future]` |
| S04 | Knowledge Base | `[P2]` | `[Future]` |
| S05 | KB Article Detail | `[P2]` | `[Future]` |
| S06 | Support Dashboard | `[P1]` | `[Future]` |

---

## 12.9 AI Module (4 screens)

| # | Screen | Priority | Status |
|---|--------|----------|--------|
| AI01 | AI Assistant (Chat Panel) | `[P1]` | `[Future]` |
| AI02 | AI Settings | `[P1]` | `[Future]` |
| AI03 | AI Usage Dashboard | `[P1]` | `[Future]` |
| AI04 | AI Report Builder | `[P2]` | `[Future]` |

---

## 12.10 Messenger & Communication (3 screens)

| # | Screen | App | Priority | Status |
|---|--------|-----|----------|--------|
| M01 | Messenger (Chat) | All | `[MVP]` | `[Built]` |
| M02 | Email Composer (CRM-linked) | Admin | `[P1]` | `[Future]` |
| M03 | Notification Center | All | `[MVP]` | `[Future]` |

---

## 12.11 Reports (8 screens)

| # | Screen | Priority | Status |
|---|--------|----------|--------|
| R01 | Reports Hub | `[MVP]` | `[Partial]` |
| R02 | CRM Pipeline Report | `[MVP]` | `[Future]` |
| R03 | Sales Performance Report | `[MVP]` | `[Future]` |
| R04 | HR Headcount Report | `[MVP]` | `[Partial]` |
| R05 | Attendance Summary Report | `[MVP]` | `[Built]` |
| R06 | Leave Balance Report | `[MVP]` | `[Future]` |
| R07 | Project Profitability Report | `[P1]` | `[Future]` |
| R08 | Custom Report Builder | `[P2]` | `[Future]` |

---

## 12.12 Settings (14 screens)

| # | Screen | Priority | Status |
|---|--------|----------|--------|
| ST01 | Company Profile | `[MVP]` | `[Future]` |
| ST02 | User Management | `[MVP]` | `[Future]` |
| ST03 | Role & Permission Editor | `[MVP]` | `[Future]` |
| ST04 | Module Configuration | `[MVP]` | `[Future]` |
| ST05 | CRM Settings (Pipelines, Sources) | `[MVP]` | `[Future]` |
| ST06 | HRM Settings (Leave Types, Rules) | `[MVP]` | `[Future]` |
| ST07 | Project Settings | `[P1]` | `[Future]` |
| ST08 | Integration Settings | `[P1]` | `[Future]` |
| ST09 | Billing & Subscription | `[MVP]` | `[Future]` |
| ST10 | Notification Preferences | `[MVP]` | `[Future]` |
| ST11 | Security Settings | `[MVP]` | `[Future]` |
| ST12 | Audit Logs | `[MVP]` | `[Future]` |
| ST13 | Data Import | `[MVP]` | `[Future]` |
| ST14 | Data Export | `[MVP]` | `[Future]` |

---

## 12.13 Client Portal (7 screens) `[P1]`

| # | Screen | Status |
|---|--------|--------|
| CL01 | Client Dashboard | `[Future]` |
| CL02 | My Projects | `[Future]` |
| CL03 | Project Detail (read-only) | `[Future]` |
| CL04 | Invoice List | `[Future]` |
| CL05 | Payment History | `[Future]` |
| CL06 | Support Tickets | `[Future]` |
| CL07 | Client Profile | `[Future]` |

---

## 12.14 Screen Count Summary

| Category | Total | Built | MVP Target |
|----------|-------|-------|------------|
| Auth & Onboarding | 8 | 3 | 8 |
| Dashboards | 6 | 2 | 4 |
| CRM | 22 | 1 | 18 |
| HRM | 28 | 18 | 20 |
| Projects | 12 | 5 | 8 |
| Finance | 10 | 1 | 0 |
| Support | 6 | 0 | 0 |
| AI | 4 | 0 | 0 |
| Messenger | 3 | 1 | 2 |
| Reports | 8 | 2 | 5 |
| Settings | 14 | 0 | 10 |
| Client Portal | 7 | 0 | 0 |
| **Total** | **128** | **33** | **75** |

**MVP requires ~75 screens.** Currently ~33 built (~44% of MVP scope).

---

## 12.15 Shared Components (300+ target)

These reusable components appear across multiple screens:

| Component | Used In | Status |
|-----------|---------|--------|
| Button | All | `[Built]` |
| Input | All forms | `[Built]` |
| Select | All forms | `[Built]` |
| Modal | All CRUD | `[Built]` |
| Card | Dashboards, lists | `[Built]` |
| Skeleton | All loading states | `[Built]` |
| Table | All list pages | `[Partial]` |
| Drawer | Detail panels | `[Future]` |
| Toast | All actions | `[Built]` |
| Badge | Status indicators | `[Partial]` |
| Avatar | User/employee display | `[Future]` |
| Breadcrumb | Detail/edit pages | `[Future]` |
| Tabs | Detail pages | `[Future]` |
| Activity Timeline | Detail pages | `[Future]` |
| Empty State | All list pages | `[Future]` |
| Pagination | All list pages | `[Future]` |
| Filter Bar | All list pages | `[Future]` |
| Date Picker | Forms, filters | `[Future]` |
| File Upload | Documents, imports | `[Future]` |
| Chart (Line/Bar/Pie) | Dashboards, reports | `[Future]` |
| Kanban Column | Project/Deal boards | `[Future]` |
| Command Palette | Global search | `[Future]` |
| Sidebar | App shell | `[Built]` |
| Header | App shell | `[Built]` |
| Dashboard Layout | App shell | `[Built]` |

---

**Previous:** [11 — Information Architecture](./11-information-architecture.md)  
**Next:** [13 — Development Phases & Roadmap](./13-development-phases.md)
