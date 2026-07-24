# Chapter 4 — CRM Permission Matrix

**Book:** 2 — CRM PRD · **Part:** 1 — Foundation · **Chapter:** 4  
**Version:** 1.0.0-draft

---

## 4.1 Permission Naming Convention

```
crm:{entity}:{action}[:scope]

Entities: lead, contact, company, deal, activity, quote, invoice, payment, product, pipeline, report, settings
Actions:  create, read, update, delete, approve, send, void, export, manage
Scope:    own | team | all (default implied by role)
```

---

## 4.2 Complete CRM Permission List

| Permission ID | Description |
|---------------|-------------|
| `crm:lead:create` | Create new leads |
| `crm:lead:read` | View own leads |
| `crm:lead:read_all` | View all tenant leads |
| `crm:lead:update` | Edit own leads |
| `crm:lead:update_all` | Edit any lead |
| `crm:lead:delete` | Soft-delete own leads |
| `crm:lead:delete_all` | Soft-delete any lead |
| `crm:lead:convert` | Convert lead to contact/deal |
| `crm:lead:assign` | Reassign lead owner |
| `crm:lead:import` | CSV/API bulk import |
| `crm:lead:export` | Export leads CSV |
| `crm:contact:create` | Create contacts |
| `crm:contact:read` | View contacts (own linked) |
| `crm:contact:read_all` | View all contacts |
| `crm:contact:update` | Edit contacts |
| `crm:contact:delete` | Soft-delete contacts |
| `crm:company:create` | Create companies |
| `crm:company:read_all` | View all companies |
| `crm:company:update` | Edit companies |
| `crm:company:delete` | Soft-delete companies |
| `crm:deal:create` | Create deals |
| `crm:deal:read` | View own deals |
| `crm:deal:read_all` | View all deals |
| `crm:deal:update` | Edit own deals (incl. stage change) |
| `crm:deal:update_all` | Edit any deal |
| `crm:deal:delete` | Soft-delete own deals |
| `crm:deal:delete_all` | Soft-delete any deal |
| `crm:deal:assign` | Reassign deal owner |
| `crm:activity:create` | Log activities |
| `crm:activity:read_all` | View all activities |
| `crm:activity:delete` | Delete own activities |
| `crm:quote:create` | Create quotations |
| `crm:quote:read_all` | View all quotes |
| `crm:quote:update` | Edit draft quotes |
| `crm:quote:send` | Send quote to client |
| `crm:quote:approve` | Approve/reject pending quotes |
| `crm:invoice:create` | Create invoices |
| `crm:invoice:read_all` | View all invoices |
| `crm:invoice:update` | Edit draft invoices |
| `crm:invoice:send` | Send invoice to client |
| `crm:invoice:void` | Void unpaid invoices |
| `crm:invoice:void_paid` | Void paid invoices (admin only) |
| `crm:payment:record` | Record offline payments |
| `crm:payment:refund` | Process refunds |
| `crm:product:manage` | Manage product catalog |
| `crm:pipeline:manage` | Configure pipelines and stages |
| `crm:report:view` | View CRM reports |
| `crm:report:export` | Export report data |
| `crm:settings:manage` | CRM module settings |
| `crm:automation:manage` | Workflow and assignment rules `[P1]` |

---

## 4.3 Role × Permission Matrix

Legend: ✅ = granted | 🔶 = own/assigned only | ❌ = denied

| Permission | tenant_admin | admin | sales_mgr | sales_rep | finance_mgr | viewer |
|------------|:---:|:---:|:---:|:---:|:---:|:---:|
| crm:lead:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| crm:lead:read_all | ✅ | ✅ | ✅ | 🔶 | ❌ | ✅ |
| crm:lead:update_all | ✅ | ✅ | ✅ | 🔶 | ❌ | ❌ |
| crm:lead:delete | ✅ | ✅ | ✅ | 🔶 | ❌ | ❌ |
| crm:lead:convert | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| crm:lead:assign | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:lead:import | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:lead:export | ✅ | ✅ | ✅ | 🔶 | ❌ | ❌ |
| crm:contact:* | ✅ | ✅ | ✅ | 🔶 | ❌ | ✅ read |
| crm:company:* | ✅ | ✅ | ✅ | 🔶 | ❌ | ✅ read |
| crm:deal:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| crm:deal:read_all | ✅ | ✅ | ✅ | 🔶 | ❌ | ✅ |
| crm:deal:update | ✅ | ✅ | ✅ | 🔶 | ❌ | ❌ |
| crm:deal:assign | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:activity:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| crm:activity:read_all | ✅ | ✅ | ✅ | 🔶 | ❌ | ✅ |
| crm:quote:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| crm:quote:send | ✅ | ✅ | ✅ | 🔶¹ | ❌ | ❌ |
| crm:quote:approve | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:invoice:create | ✅ | ✅ | ✅ | 🔶² | ✅ | ❌ |
| crm:invoice:send | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| crm:invoice:void | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| crm:invoice:void_paid | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| crm:payment:record | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| crm:payment:refund | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| crm:product:manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:pipeline:manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:report:view | ✅ | ✅ | ✅ | 🔶³ | ✅ | ✅ |
| crm:report:export | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| crm:settings:manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| crm:automation:manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

¹ sales_rep can send if quote total < approval threshold  
² sales_rep can create invoice only for own won deals `[Configurable]`  
³ sales_rep sees own performance report only

---

## 4.4 API Enforcement

Every CRM API endpoint must:

1. Validate JWT + tenant context
2. Check module enabled for tenant
3. Check permission via middleware: `requirePermission('crm:deal:update')`
4. Apply scope filter on queries: `{ tenant_id, owner_id }` for `own` scope
5. Return `403 Forbidden` with `{ code: 'PERMISSION_DENIED', permission: '...' }`
6. Return `403` with `{ code: 'MODULE_DISABLED' }` if CRM not in plan

---

## 4.5 UI Enforcement

| UI Element | Permission Check |
|------------|------------------|
| "+ New Lead" button | `crm:lead:create` |
| Edit button on deal | `crm:deal:update` or `crm:deal:update_all` |
| Delete menu item | `crm:lead:delete` or `crm:lead:delete_all` |
| Pipeline settings gear | `crm:pipeline:manage` |
| Approve Quote button | `crm:quote:approve` |
| Void Invoice button | `crm:invoice:void` |
| Import CSV button | `crm:lead:import` |
| Export button | `crm:lead:export` or `crm:report:export` |

**Rule:** Never rely on UI hiding alone — API must always enforce.

---

## 4.6 Field-Level Permissions `[P1]`

| Field | Visible To | Editable By |
|-------|------------|-------------|
| Deal value / amount | All CRM roles with deal read | deal:update |
| Deal expected close date | All CRM roles with deal read | deal:update |
| Quote discount % | sales_rep+ | quote:update; approve if > threshold |
| Invoice payment details | finance_manager, admin | payment:record |
| Lead source (internal) | sales_manager+ | lead:update_all |
| Commission field `[P2]` | sales_manager, admin | admin only |

---

**Previous:** [03 — CRM User Roles](./03-crm-user-roles.md)  
**Next:** [05 — CRM Navigation & IA](./05-crm-navigation.md)
