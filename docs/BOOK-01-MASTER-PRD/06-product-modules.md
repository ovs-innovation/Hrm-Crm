# Chapter 6 — Product Modules Overview

**Book:** 1 — Master PRD  
**Chapter:** 6 of 13  
**Version:** 1.0.0-draft

---

## 6.1 Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        VASTORA ONE                               │
├─────────┬─────────┬──────────┬─────────┬──────────┬────────────┤
│   CRM   │   HRM   │ Projects │ Finance │ Support  │     AI     │
├─────────┴─────────┴──────────┴─────────┴──────────┴────────────┤
│  Platform Services: Auth, RBAC, Notifications, Documents,       │
│  Calendar, Email, WhatsApp, Analytics, Billing, Audit Logs        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6.2 Module Summary Table

| Module | Book | MVP Status | Primary Users | Key Entities |
|--------|------|------------|---------------|--------------|
| **CRM** | Book 2 | `[Future]` | Sales, Marketing | Lead, Contact, Company, Deal, Activity |
| **HRM** | Book 3 | `[Partial]` | HR, Managers, Employees | Employee, Department, Attendance, Leave, Payroll |
| **Projects** | Book 4 | `[Partial]` | PM, Dev, Clients | Project, Task, Sprint, Bug, TimeLog |
| **Finance** | Book 5 | `[Future]` | Finance, Admin | Income, Expense, Vendor, GSTReturn |
| **Support** | — | `[Future]` | Support, Clients | Ticket, KB Article, Chat |
| **AI** | Book 6 | `[Future]` | All roles | Prompt, Summary, Analysis |
| **Platform** | Books 7–9 | `[Partial]` | Admin | Tenant, User, Role, Subscription |

---

## 6.3 CRM Module

**Purpose:** Manage the entire customer lifecycle from first touch to repeat business.

### Sub-Modules

| Sub-Module | Description | Priority |
|------------|-------------|----------|
| Dashboard | Pipeline metrics, activity feed, forecasts | `[MVP]` |
| Leads | Capture, score, qualify, convert | `[MVP]` |
| Contacts | Individual people, linked to companies | `[MVP]` |
| Companies | Accounts/organizations | `[MVP]` |
| Deals | Pipeline stages, values, probabilities | `[MVP]` |
| Pipelines | Configurable stages per business unit | `[MVP]` |
| Activities | Calls, emails, meetings, notes | `[MVP]` |
| Calendar | Shared team calendar, CRM events | `[P1]` |
| Meetings | Schedule, agenda, AI summary | `[P1]` |
| Tasks | CRM-linked task management | `[MVP]` |
| Notes | Rich-text notes on any record | `[MVP]` |
| Documents | Files attached to records | `[P1]` |
| Quotations | Quote builder from deal line items | `[MVP]` |
| Invoices | Invoice generation and tracking | `[MVP]` |
| Payments | Payment recording, reconciliation | `[MVP]` |
| Reports | Pipeline, conversion, revenue reports | `[MVP]` |

### Current Codebase

- `[Built]` Clients page (`Admin/src/pages/crm/Clients.jsx`)
- `[Future]` Leads, Deals, Pipeline, Quotes, Invoices, Payments

### Cross-Module Links

- Deal won → creates Project
- Deal/Project → generates Invoice
- Contact → can become Client Portal user `[P1]`

**Detailed spec:** Book 2 — CRM PRD

---

## 6.4 HRM Module

**Purpose:** Manage the complete employee lifecycle from hiring to exit.

### Sub-Modules

| Sub-Module | Description | Priority | Codebase |
|------------|-------------|----------|----------|
| Employees | Profiles, org chart, documents | `[MVP]` | `[Built]` |
| Departments | Org structure | `[MVP]` | `[Built]` |
| Designations | Job titles, levels | `[MVP]` | `[Built]` |
| Attendance | Clock in/out, reports | `[MVP]` | `[Built]` |
| Leave | Apply, approve, balance, calendar | `[MVP]` | `[Built]` |
| Shift Roster | Shift scheduling | `[MVP]` | `[Built]` |
| Holiday | Company holiday calendar | `[MVP]` | `[Built]` |
| Payroll | Salary processing, deductions | `[P1]` | `[Partial]` |
| Payslips | Generate and distribute | `[MVP]` | `[Built]` |
| Recruitment | Job posts, applicants, pipeline | `[P1]` | `[Partial]` |
| Performance | Reviews, goals, KPIs | `[P1]` | `[Partial]` |
| Assets | Laptop, equipment assignment | `[P2]` | `[Future]` |
| Documents | Employee document vault | `[P1]` | `[Future]` |
| Exit Management | Offboarding checklist, F&F | `[P2]` | `[Future]` |
| Appreciation | Peer recognition | `[MVP]` | `[Built]` |
| Announcements | Company-wide comms | `[MVP]` | `[Built]` |
| Daily Reports | Employee daily work logs | `[MVP]` | `[Built]` |
| Core HR | Policies, settings | `[P1]` | `[Partial]` |

### Cross-Module Links

- Employee assigned to Project tasks
- Employee linked as Deal owner in CRM
- Payroll costs flow to Finance module

**Detailed spec:** Book 3 — HRM PRD

---

## 6.5 Projects Module

**Purpose:** Plan, execute, and deliver client and internal projects.

### Sub-Modules

| Sub-Module | Description | Priority | Codebase |
|------------|-------------|----------|----------|
| Project List | All projects with status filters | `[MVP]` | `[Built]` |
| Kanban Board | Drag-drop task columns | `[MVP]` | `[Partial]` |
| List View | Sortable/filterable task table | `[MVP]` | `[Built]` |
| Timeline / Gantt | Visual schedule | `[P1]` | `[Future]` |
| Sprint View | Agile sprint planning | `[P1]` | `[Future]` |
| Tasks | Create, assign, prioritize, due dates | `[MVP]` | `[Built]` |
| Bugs | Bug tracker with severity/priority | `[P1]` | `[Future]` |
| Time Tracking | Log hours against tasks/projects | `[MVP]` | `[Partial]` |
| Milestones | Project phase markers | `[P1]` | `[Future]` |
| Documents | Project file repository | `[P1]` | `[Future]` |

### Cross-Module Links

- Created from won CRM Deal
- Time logs → Invoice line items
- Team members from HRM Employee records

**Detailed spec:** Book 4 — Projects PRD

---

## 6.6 Finance Module

**Purpose:** Track business income, expenses, vendors, and tax compliance.

### Sub-Modules

| Sub-Module | Description | Priority |
|------------|-------------|----------|
| Dashboard | Cash flow, P&L snapshot | `[P1]` |
| Income | Revenue records (linked to CRM invoices) | `[P1]` |
| Expenses | Business expense tracking | `[P1]` |
| Vendors | Supplier/vendor management | `[P1]` |
| GST | GST calculation, reports, filing prep | `[P1]` |
| Reports | P&L, balance sheet summary, tax reports | `[P1]` |
| Bank Reconciliation | Match payments to records | `[P2]` |

### Cross-Module Links

- CRM Invoices → Finance Income
- HRM Payroll → Finance Expenses
- Project costs → Finance reporting

**Detailed spec:** Book 5 — Finance PRD

---

## 6.7 Support Module

**Purpose:** Customer support via tickets, chat, and knowledge base.

### Sub-Modules

| Sub-Module | Description | Priority |
|------------|-------------|----------|
| Tickets | Create, assign, prioritize, resolve | `[P1]` |
| Chat | Live chat (linked to Messenger) | `[P1]` |
| Knowledge Base | Self-service articles | `[P2]` |
| SLA Management | Response/resolution time rules | `[P2]` |
| Customer Satisfaction | Post-resolution CSAT surveys | `[P2]` |

### Current Codebase

- `[Built]` Messenger (internal chat via Socket.IO)
- `[Future]` External support tickets, KB

---

## 6.8 AI Module

**Purpose:** AI-powered assistance embedded across all workflows.

### Sub-Modules

| Sub-Module | Description | Priority |
|------------|-------------|----------|
| AI Assistant | Context-aware chat in any module | `[P1]` |
| Email Writer | Draft emails from CRM context | `[P1]` |
| Proposal Generator | Generate quotes/proposals from deal data | `[P1]` |
| Meeting Summary | Transcribe + summarize meetings | `[P2]` |
| Lead Analysis | Score and suggest next actions | `[P1]` |
| Resume Parser | Extract data from CV uploads | `[P2]` |
| AI Reports | Natural language → dashboard/report | `[P2]` |

**Detailed spec:** Book 6 — AI PRD

---

## 6.9 Platform Services (Shared)

These are not user-facing "modules" but foundational capabilities:

| Service | Description | Priority | Codebase |
|---------|-------------|----------|----------|
| **Authentication** | Login, signup, 2FA, session mgmt | `[MVP]` | `[Built]` |
| **RBAC** | Roles, permissions, tenant isolation | `[MVP]` | `[Partial]` |
| **Notifications** | In-app, email, push `[P1]` | `[MVP]` | `[Partial]` |
| **Messenger** | Internal real-time chat | `[MVP]` | `[Built]` |
| **Documents** | File upload, S3 storage | `[P1]` | `[Future]` |
| **Calendar** | Shared calendar engine | `[P1]` | `[Future]` |
| **Email Integration** | Send/receive via SMTP/API | `[P1]` | `[Future]` |
| **WhatsApp** | Business API integration | `[P2]` | `[Future]` |
| **Audit Logs** | Track sensitive actions | `[MVP]` | `[Future]` |
| **Billing & Subscription** | SaaS billing engine | `[MVP]` | `[Future]` |
| **Search** | Global search across modules | `[P1]` | `[Future]` |
| **Import/Export** | CSV/Excel data migration | `[MVP]` | `[Future]` |

---

## 6.10 Module Dependency Graph

```
Platform (Auth, RBAC, Tenant)
    │
    ├── CRM ──────────► Projects ──► Finance
    │     │                │
    │     └── Invoices ────┘
    │
    ├── HRM ──────────► Finance (payroll costs)
    │
    ├── Support ◄── CRM (client context)
    │
    └── AI ◄── All modules (context injection)
```

**Build order recommendation:**
1. Platform + HRM (partially built)
2. CRM core (Leads → Deals → Quotes → Invoices)
3. Projects (enhance existing)
4. Finance
5. Support + AI
6. Client Portal

---

## 6.11 Module Enable/Disable (Per Tenant)

Each tenant can enable/disable modules based on subscription tier:

| Module | Starter | Growth | Enterprise |
|--------|---------|--------|------------|
| HRM | ✅ | ✅ | ✅ |
| CRM | ❌ | ✅ | ✅ |
| Projects | ❌ | ✅ | ✅ |
| Finance | ❌ | ❌ | ✅ |
| Support | ❌ | ❌ | ✅ |
| AI | ❌ | Add-on | ✅ |

Disabled modules: hidden from navigation, API returns 403, data preserved.

---

## 6.12 Inter-Module Record Linking

| Source Record | Can Link To | Example |
|---------------|-------------|---------|
| Deal | Contact, Company, Project, Invoice | Won deal → project |
| Project | Deal, Company, Employees, Tasks | Agency project for client X |
| Employee | Department, Projects, Deals | Sales rep owns deals |
| Invoice | Deal, Project, Contact, Payment | Project milestone invoice |
| Ticket | Contact, Company, Project | Client support on Project Y |
| Task | Project, Employee, Deal | Follow-up call task on deal |

Universal **Activity Timeline** component shows linked record history on every detail page.

---

**Previous:** [05 — Competitive Landscape](./05-competitive-landscape.md)  
**Next:** [07 — SaaS Business Model](./07-saas-business-model.md)
