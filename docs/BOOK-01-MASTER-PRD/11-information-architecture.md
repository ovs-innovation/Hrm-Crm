# Chapter 11 — Information Architecture & Navigation

**Book:** 1 — Master PRD  
**Chapter:** 11 of 13  
**Version:** 1.0.0-draft

---

## 11.1 Application Surfaces

| App | URL Pattern | Users | Auth |
|-----|-------------|-------|------|
| **Admin Console** | `app.vastora.com` or `{tenant}.vastora.com/admin` | Admins, Managers | Email + password + 2FA |
| **Employee Portal** | `{tenant}.vastora.com` | Employees | Email + password |
| **Client Portal** | `{tenant}.vastora.com/client` | External clients | Email + password (invite-only) |
| **Marketing Site** | `vastora.com` | Public | None |
| **Super Admin** | `admin.vastora.com` | Vastora internal | Internal auth |

---

## 11.2 Admin Console — Navigation Structure

Slack-inspired collapsible sidebar with module sections:

```
┌─────────────────────────┐
│ VASTORA                  │
│ Admin Console            │
├─────────────────────────┤
│ 🏠 Dashboard             │
│ 💬 Messenger             │
│                          │
│ ── CRM ──────────────    │
│ 📊 CRM Dashboard         │
│ 🎯 Leads                 │
│ 👤 Contacts              │
│ 🏢 Companies             │
│ 💰 Deals                 │
│ 📋 Activities            │
│ 📅 Calendar              │
│ 📝 Tasks                 │
│ 📄 Quotations            │
│ 🧾 Invoices              │
│ 💳 Payments              │
│ 📈 CRM Reports           │
│                          │
│ ── HR ─────────────────  │
│ 👥 Employees             │
│ 📋 Leaves                │
│ 🕐 Shift Roster          │
│ ✅ Attendance            │
│ 🎉 Holiday               │
│ ✔️ Tasks                 │
│ 📢 Recruitment           │
│ 🏷 Designation           │
│ 🏗 Department            │
│ 📝 Daily Reports         │
│ ⭐ Appreciation          │
│ 📣 Announcements         │
│ 💵 Payroll               │
│                          │
│ ── PROJECTS ───────────  │
│ 📁 Projects              │
│ ✅ Tasks                 │
│ ⏱ Timesheet              │
│                          │
│ ── FINANCE ────────────  │
│ 💰 Finance Dashboard     │
│ 📈 Income                │
│ 📉 Expenses              │
│ 🏪 Vendors               │
│ 📊 GST Reports           │
│                          │
│ ── SUPPORT ────────────  │
│ 🎫 Tickets               │
│ 📚 Knowledge Base        │
│                          │
│ ── AI ─────────────────  │
│ 🤖 AI Assistant          │
│                          │
│ ── SYSTEM ─────────────  │
│ 📊 Reports               │
│ ⚙️ Settings              │
└─────────────────────────┘
```

### Current Codebase Navigation (Admin)

Already implemented (HRM-heavy):

- Dashboard, Messenger
- HR section: Employees, Leaves, Shift Roster, Attendance, Holiday, Tasks, Recruitment, Designation, Department, Daily Reports, Appreciation, Announcements, Payroll
- CRM: Clients (placeholder for full CRM)
- Projects, Reports

---

## 11.3 Employee Portal — Navigation Structure

```
┌─────────────────────────┐
│ VASTORA                  │
│ Employee Portal          │
├─────────────────────────┤
│ 🏠 Dashboard             │
│ ✅ Attendance            │
│ 📅 My Leaves             │
│ ✔️ My Tasks              │
│ 💬 Messenger             │
│ 💵 Payslips              │
│ 📝 Daily Reports         │
│ 📋 Policies              │
│ 👤 My Profile            │
│                          │
│ ── MANAGEMENT ─────────  │  (visible if role ≥ manager)
│ 👥 Manage Employees      │
│ ✅ Manage Attendance     │
│ 📅 Manage Leaves         │
│ ✔️ Manage Tasks          │
│ 🎉 Manage Holidays       │
│ 📣 Announcements         │
│ ⭐ Appreciation          │
│ 🕐 Shift Roster          │
│ 📁 Manage Projects       │
│ 📊 Manage Reports        │
└─────────────────────────┘
```

---

## 11.4 Client Portal — Navigation Structure `[P1]`

```
┌─────────────────────────┐
│ VASTORA                  │
│ Client Portal            │
├─────────────────────────┤
│ 🏠 Dashboard             │
│ 📁 My Projects           │
│ 🧾 Invoices              │
│ 💳 Payments              │
│ 🎫 Support Tickets       │
│ 📄 Documents             │
│ 💬 Messages              │
│ 👤 My Profile            │
└─────────────────────────┘
```

---

## 11.5 Header (Global)

Present on all app surfaces:

```
┌──────────────────────────────────────────────────────────────┐
│ [≡ Mobile menu]  [Search ⌘K]     [🔔 Notifications] [👤 ▾] │
└──────────────────────────────────────────────────────────────┘
```

### Header Components

| Component | Description |
|-----------|-------------|
| **Mobile menu toggle** | Hamburger icon, visible < 768px |
| **Global search** | `⌘K` command palette `[P1]` |
| **Notifications bell** | Unread count badge, dropdown list |
| **User menu** | Profile, Settings, Switch Dashboard, Logout |
| **Dashboard switcher** | If user has multiple dashboard access (CEO/Sales/HR) |

---

## 11.6 URL Structure (Routing Convention)

### Pattern

```
/{module}/{sub-module}/{action}/{id}

Examples:
/crm/leads                    → Lead list
/crm/leads/new                → Create lead
/crm/leads/:id                → Lead detail
/crm/deals/:id/edit           → Edit deal
/hrm/employees                → Employee list
/hrm/employees/:id            → Employee profile
/hrm/payroll/invoice/:id      → Payslip view
/projects/:id/board           → Project kanban
/projects/:id/tasks/:taskId   → Task detail
/finance/income               → Income list
/settings/company             → Company settings
/settings/users               → User management
/settings/billing             → Subscription billing
```

### Rules

- Lowercase, hyphen-separated
- Plural nouns for collections (`/leads`, `/employees`)
- Singular for settings (`/settings/company`)
- No trailing slashes
- ID params are UUID or MongoDB ObjectId

---

## 11.7 Breadcrumb Convention

Every page below top-level shows breadcrumbs:

```
Dashboard > CRM > Deals > Acme Corp Enterprise Deal
```

Rules:
- Each segment is clickable (except current page)
- Max 4 segments visible; truncate middle with "..." if deeper
- Current page segment is plain text (not a link)

---

## 11.8 Settings Architecture

Settings is a separate section, accessible from user menu:

```
Settings
├── Company
│   ├── Profile (name, logo, address, GSTIN)
│   ├── Business Hours
│   └── Currency & Locale
├── Users & Roles
│   ├── Users (invite, manage, deactivate)
│   ├── Roles (system + custom)
│   └── Permission Matrix
├── Modules
│   ├── Enabled Modules
│   ├── CRM Settings (pipelines, lead sources, deal stages)
│   ├── HRM Settings (leave types, attendance rules, payroll config)
│   └── Project Settings (task statuses, sprint config)
├── Integrations
│   ├── Email (SMTP / Gmail / Outlook)
│   ├── WhatsApp Business API
│   ├── Payment Gateway (Razorpay / Stripe)
│   └── Calendar Sync (Google / Outlook)
├── Billing & Subscription
│   ├── Current Plan
│   ├── Usage & Limits
│   ├── Invoices (Vastora billing)
│   └── Payment Method
├── Notifications
│   ├── Email Preferences
│   └── In-App Preferences
├── Security
│   ├── Two-Factor Authentication
│   ├── Session Management
│   ├── IP Restrictions
│   └── Audit Logs
├── Data
│   ├── Import (CSV/Excel)
│   ├── Export
│   └── Data Retention
└── AI Settings
    ├── AI Assistant Configuration
    └── Usage & Limits
```

---

## 11.9 Module Entry Points

How users reach each module:

| Entry Point | Behavior |
|-------------|----------|
| Sidebar nav | Primary — always visible for enabled modules |
| Dashboard widgets | Quick links ("3 deals need follow-up →") |
| Global search | Direct jump to any record |
| Notifications | Click notification → navigate to record |
| Cross-module links | "View Project" link on deal detail page |
| Command palette | Type module name → navigate |

---

## 11.10 Navigation State Rules

| Rule | Specification |
|------|---------------|
| Active item | `app-nav-active` class — brand tint background |
| Section headers | Uppercase, 11px, muted, not clickable |
| Collapsed sections | Remember state in localStorage |
| Disabled modules | Hidden from nav (not grayed out) |
| Badge counts | Show on nav items (e.g., "Leaves (3 pending)") |
| Mobile | Sidebar slides in as overlay; closes on nav click |

---

## 11.11 Information Hierarchy (Content Priority)

Within any page, content priority follows:

```
1. Primary action + status     (what matters most)
2. Key metrics / summary       (at-a-glance context)
3. Main content                (list, form, board)
4. Secondary information       (related records, metadata)
5. Activity / history          (timeline, audit log)
```

This ensures users see what matters first — Stripe Dashboard principle.

---

## 11.12 Cross-Module Quick Actions

Available from any page via command palette or quick-action menu:

| Action | Available From |
|--------|----------------|
| Create Lead | Any page |
| Create Deal | Any page |
| Log Activity | Any page |
| Create Task | Any page |
| Apply Leave | Employee portal |
| Send Message | Any page (Messenger) |
| Create Invoice | CRM, Projects, Finance |
| Search Anything | Any page (`⌘K`) |

---

**Previous:** [10 — UX Principles](./10-ux-principles.md)  
**Next:** [12 — Complete Screen Inventory](./12-screen-inventory.md)
