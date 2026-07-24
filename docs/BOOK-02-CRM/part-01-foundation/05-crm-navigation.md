# Chapter 5 — CRM Navigation & Information Architecture

**Book:** 2 — CRM PRD · **Part:** 1 — Foundation · **Chapter:** 5  
**Version:** 1.0.0-draft

---

## 5.1 CRM Module Placement

CRM lives under the **Admin Console** sidebar as a collapsible section. It replaces the current single `/crm` → Clients route.

### Sidebar Structure (CRM Section)

```
── CRM ─────────────────────
📊 Dashboard          /crm
🎯 Leads              /crm/leads
👤 Contacts           /crm/contacts
🏢 Companies          /crm/companies
💰 Deals              /crm/deals
📋 Activities         /crm/activities
📅 Calendar           /crm/calendar          [P1]
📝 Tasks              /crm/tasks
📄 Quotations         /crm/quotes
🧾 Invoices           /crm/invoices
💳 Payments           /crm/payments
📈 Reports            /crm/reports
⚙️ CRM Settings       /crm/settings          (sales_manager+)
```

### Badge Counts

| Nav Item | Badge Source |
|----------|--------------|
| Leads | Unassigned leads count (sales_manager only) |
| Deals | Deals with overdue activities |
| Quotations | Quotes pending approval |
| Invoices | Overdue unpaid invoices |
| Tasks | My open CRM tasks due today |

---

## 5.2 URL Routing Map

| Route | Screen | Permission |
|-------|--------|--------------|
| `/crm` | CRM Dashboard | `crm:report:view` |
| `/crm/leads` | Lead List | `crm:lead:read` |
| `/crm/leads/new` | Create Lead | `crm:lead:create` |
| `/crm/leads/:id` | Lead Detail | `crm:lead:read` |
| `/crm/leads/:id/edit` | Edit Lead | `crm:lead:update` |
| `/crm/leads/import` | CSV Import | `crm:lead:import` |
| `/crm/contacts` | Contact List | `crm:contact:read` |
| `/crm/contacts/:id` | Contact Detail | `crm:contact:read` |
| `/crm/companies` | Company List | `crm:company:read_all` |
| `/crm/companies/:id` | Company Detail | `crm:company:read_all` |
| `/crm/deals` | Deal List (table) | `crm:deal:read` |
| `/crm/deals/board` | Deal Pipeline (Kanban) | `crm:deal:read` |
| `/crm/deals/:id` | Deal Detail | `crm:deal:read` |
| `/crm/activities` | Activity List | `crm:activity:read_all` |
| `/crm/calendar` | Calendar View | `crm:activity:read_all` |
| `/crm/tasks` | CRM Tasks | `crm:activity:create` |
| `/crm/quotes` | Quotation List | `crm:quote:read_all` |
| `/crm/quotes/new?deal=:id` | Create Quote | `crm:quote:create` |
| `/crm/quotes/:id` | Quote Detail + PDF | `crm:quote:read_all` |
| `/crm/invoices` | Invoice List | `crm:invoice:read_all` |
| `/crm/invoices/:id` | Invoice Detail + PDF | `crm:invoice:read_all` |
| `/crm/payments` | Payment List | `crm:payment:record` |
| `/crm/reports` | Reports Hub | `crm:report:view` |
| `/crm/reports/:reportId` | Specific Report | `crm:report:view` |
| `/crm/settings` | CRM Settings | `crm:settings:manage` |
| `/crm/settings/pipelines` | Pipeline Config | `crm:pipeline:manage` |
| `/crm/settings/products` | Product Catalog | `crm:product:manage` |
| `/crm/settings/automation` | Automation Rules | `crm:automation:manage` |

---

## 5.3 Default Landing by Role

| Role | CRM Home Route | Rationale |
|------|----------------|-----------|
| sales_rep | `/crm/deals/board` | Pipeline is daily workspace |
| sales_manager | `/crm` (dashboard) | Needs team overview first |
| finance_manager | `/crm/invoices` | Invoice-focused workflow |
| admin | `/crm` | Full dashboard |
| viewer | `/crm/reports` | Read-only analytics |

Configurable in User Preferences `[P1]`.

---

## 5.4 Cross-Module Navigation Links

| From | Link | To |
|------|------|-----|
| Deal Detail (Won) | "View Project" | `/projects/:id` |
| Deal Detail | "View Company" | `/crm/companies/:id` |
| Contact Detail | "View Deals" | Filtered `/crm/deals?contact=:id` |
| Invoice Detail | "View Payment" | `/crm/payments?invoice=:id` |
| Company Detail | "Support Tickets" | `/support/tickets?company=:id` `[P1]` |
| Quote Detail | "Create Invoice" | `/crm/invoices/new?quote=:id` |

---

## 5.5 Global CRM Quick Actions

Available via header **+ Quick Add** menu and `⌘N` (context-aware):

| Action | Route | Permission |
|--------|-------|------------|
| New Lead | `/crm/leads/new` | `crm:lead:create` |
| New Contact | Modal | `crm:contact:create` |
| New Deal | `/crm/deals/new` | `crm:deal:create` |
| Log Call | Activity modal | `crm:activity:create` |
| New Quote | `/crm/quotes/new` | `crm:quote:create` |
| New Invoice | `/crm/invoices/new` | `crm:invoice:create` |

---

## 5.6 Breadcrumb Patterns

```
CRM > Leads > Rajesh Kumar
CRM > Deals > Board > Acme Corp Enterprise
CRM > Quotations > QT-2026-0042
CRM > Settings > Pipelines
```

---

## 5.7 Mobile Navigation `[P1]`

CRM mobile priority tabs (bottom bar):

1. **Deals** (pipeline simplified list view)
2. **Leads** (card list)
3. **+ Add** (lead, activity, task)
4. **Tasks** (due today)
5. **More** (contacts, invoices, reports)

Kanban drag-drop on mobile: horizontal scroll columns, long-press to drag.

---

## 5.8 Migration from Current `/crm` Route

| Current | New |
|---------|-----|
| `/crm` → Clients page | `/crm/companies` + redirect old bookmarks |
| Client with status Lead | `/crm/leads/:id` |
| Client with status Active | `/crm/contacts/:id` |

Deprecation: `/crm` redirects to `/crm/dashboard` with toast "CRM has been upgraded" (one-time per user).

---

**Previous:** [04 — Permission Matrix](./04-crm-permission-matrix.md)  
**Next:** [06 — CRM Dashboard](./06-crm-dashboard.md)
