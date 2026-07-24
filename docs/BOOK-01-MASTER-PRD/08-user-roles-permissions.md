# Chapter 8 — User Roles & Permissions

**Book:** 1 — Master PRD  
**Chapter:** 8 of 13  
**Version:** 1.0.0-draft

---

## 8.1 Role Hierarchy

```
Super Admin (Vastora Platform — internal only)
    │
Tenant Admin (Company Owner)
    │
    ├── Admin (Full module access, no billing)
    │
    ├── Department Managers
    │     ├── Sales Manager
    │     ├── HR Manager
    │     ├── Project Manager
    │     └── Finance Manager
    │
    ├── Team Leads
    │     ├── Sales Rep
    │     ├── HR Executive
    │     └── Developer / Designer
    │
    ├── Employee (Self-service portal)
    │
    └── Client (External portal) [P1]
```

---

## 8.2 System Roles (Predefined)

These roles ship out-of-the-box. Tenant Admins can customize permissions but not delete system roles.

| Role ID | Display Name | App Surface | Description |
|---------|--------------|-------------|-------------|
| `tenant_admin` | Tenant Admin | Admin Console | Full access including billing, user mgmt, all modules |
| `admin` | Admin | Admin Console | Full module access, no billing/settings |
| `sales_manager` | Sales Manager | Admin Console | Full CRM access, team deals, reports |
| `sales_rep` | Sales Rep | Admin Console | Own deals/leads, limited reports |
| `hr_manager` | HR Manager | Admin Console | Full HRM access, payroll, recruitment |
| `hr_executive` | HR Executive | Admin Console | Employee records, attendance, leave approval |
| `project_manager` | Project Manager | Admin Console | Full project access, team tasks, time approval |
| `finance_manager` | Finance Manager | Admin Console | Full finance access, invoices, reports |
| `employee` | Employee | Employee Portal | Self-service: attendance, leave, tasks, payslips |
| `client` | Client User | Client Portal | Own projects, invoices, tickets `[P1]` |
| `viewer` | Viewer | Admin Console | Read-only access to assigned modules |
| `custom_*` | Custom Role | Configurable | Tenant-created with granular permissions |

---

## 8.3 Permission Model

### Structure

```
Permission = Module : Resource : Action

Examples:
  crm:deals:create
  crm:deals:read
  crm:deals:update
  crm:deals:delete
  crm:deals:read_all     (see all deals, not just own)
  hrm:payroll:process
  hrm:leave:approve
  projects:tasks:assign
  finance:invoices:void
  platform:users:invite
  platform:settings:manage
  platform:billing:manage
```

### Action Types

| Action | Description |
|--------|-------------|
| `create` | Create new records |
| `read` | View own records |
| `read_all` | View all records in module (manager scope) |
| `update` | Edit own records |
| `update_all` | Edit any record in module |
| `delete` | Soft-delete own records |
| `delete_all` | Soft-delete any record |
| `approve` | Approve workflows (leave, expenses, quotes) |
| `export` | Export data to CSV/Excel |
| `manage` | Module settings and configuration |
| `process` | Execute sensitive operations (payroll run, invoice void) |

### Scope Modifiers

| Scope | Description |
|-------|-------------|
| `own` | Only records assigned to or created by the user |
| `team` | Records belonging to user's team/department |
| `all` | All records in the tenant |

Default: `read` and `update` are `own` scope. `read_all` and `update_all` are manager scope.

---

## 8.4 Permission Matrix — CRM Module

| Permission | Tenant Admin | Sales Mgr | Sales Rep | Viewer |
|------------|:---:|:---:|:---:|:---:|
| crm:leads:create | ✅ | ✅ | ✅ | ❌ |
| crm:leads:read_all | ✅ | ✅ | ❌ | ✅ |
| crm:leads:update_all | ✅ | ✅ | ❌ | ❌ |
| crm:leads:delete | ✅ | ✅ | own | ❌ |
| crm:deals:create | ✅ | ✅ | ✅ | ❌ |
| crm:deals:read_all | ✅ | ✅ | ❌ | ✅ |
| crm:deals:update_all | ✅ | ✅ | own | ❌ |
| crm:contacts:create | ✅ | ✅ | ✅ | ❌ |
| crm:contacts:read_all | ✅ | ✅ | ✅ | ✅ |
| crm:companies:manage | ✅ | ✅ | ❌ | ❌ |
| crm:quotes:create | ✅ | ✅ | ✅ | ❌ |
| crm:quotes:approve | ✅ | ✅ | ❌ | ❌ |
| crm:invoices:create | ✅ | ✅ | ❌ | ❌ |
| crm:invoices:void | ✅ | ❌ | ❌ | ❌ |
| crm:reports:view | ✅ | ✅ | own | ✅ |
| crm:settings:manage | ✅ | ❌ | ❌ | ❌ |

---

## 8.5 Permission Matrix — HRM Module

| Permission | Tenant Admin | HR Mgr | HR Exec | Employee |
|------------|:---:|:---:|:---:|:---:|
| hrm:employees:create | ✅ | ✅ | ✅ | ❌ |
| hrm:employees:read_all | ✅ | ✅ | ✅ | own |
| hrm:employees:update_all | ✅ | ✅ | ✅ | own |
| hrm:employees:delete | ✅ | ✅ | ❌ | ❌ |
| hrm:attendance:read_all | ✅ | ✅ | ✅ | own |
| hrm:attendance:manage | ✅ | ✅ | ✅ | ❌ |
| hrm:leave:apply | ✅ | ✅ | ✅ | ✅ |
| hrm:leave:approve | ✅ | ✅ | ✅ | ❌ |
| hrm:payroll:view | ✅ | ✅ | ❌ | own |
| hrm:payroll:process | ✅ | ✅ | ❌ | ❌ |
| hrm:recruitment:manage | ✅ | ✅ | ❌ | ❌ |
| hrm:performance:manage | ✅ | ✅ | ❌ | ❌ |
| hrm:reports:view | ✅ | ✅ | ❌ | ❌ |
| hrm:settings:manage | ✅ | ✅ | ❌ | ❌ |

---

## 8.6 Permission Matrix — Projects Module

| Permission | Tenant Admin | PM | Team Lead | Employee |
|------------|:---:|:---:|:---:|:---:|
| projects:create | ✅ | ✅ | ❌ | ❌ |
| projects:read_all | ✅ | ✅ | team | assigned |
| projects:update | ✅ | ✅ | team | ❌ |
| projects:tasks:create | ✅ | ✅ | ✅ | ✅ |
| projects:tasks:assign | ✅ | ✅ | ✅ | ❌ |
| projects:time:log | ✅ | ✅ | ✅ | ✅ |
| projects:time:approve | ✅ | ✅ | ✅ | ❌ |
| projects:reports:view | ✅ | ✅ | ❌ | ❌ |

---

## 8.7 Permission Matrix — Platform

| Permission | Tenant Admin | Admin | Others |
|------------|:---:|:---:|:---:|
| platform:users:invite | ✅ | ✅ | ❌ |
| platform:users:remove | ✅ | ✅ | ❌ |
| platform:roles:manage | ✅ | ❌ | ❌ |
| platform:settings:manage | ✅ | ✅ | ❌ |
| platform:billing:manage | ✅ | ❌ | ❌ |
| platform:audit:view | ✅ | ✅ | ❌ |
| platform:modules:enable | ✅ | ❌ | ❌ |
| platform:integrations:manage | ✅ | ✅ | ❌ |
| platform:data:export | ✅ | ✅ | ❌ |
| platform:data:import | ✅ | ✅ | ❌ |

---

## 8.8 Dashboard Access by Role

| Dashboard | Roles |
|-----------|-------|
| **CEO Dashboard** | tenant_admin, admin |
| **Sales Dashboard** | tenant_admin, admin, sales_manager, sales_rep |
| **HR Dashboard** | tenant_admin, admin, hr_manager, hr_executive |
| **Manager Dashboard** | project_manager, department managers |
| **Employee Dashboard** | employee (Employee Portal) |
| **Client Dashboard** | client (Client Portal) `[P1]` |
| **Finance Dashboard** | tenant_admin, finance_manager |

Users with multiple roles see a **dashboard switcher** in the header.

---

## 8.9 Authentication & Security Requirements

| Requirement | Specification | Priority |
|-------------|---------------|----------|
| Email + password login | bcrypt hashed, min 8 chars | `[MVP]` |
| JWT session tokens | Access (15min) + Refresh (7d) | `[MVP]` |
| 2FA (TOTP) | Required for tenant_admin, optional for others | `[MVP]` |
| Session management | View/revoke active sessions | `[P1]` |
| IP restriction | Allowlist IPs for admin roles | `[P1]` |
| Password policy | Min 8 chars, 1 upper, 1 number, 1 special | `[MVP]` |
| Account lockout | 5 failed attempts → 15min lock | `[MVP]` |
| SSO (SAML/OIDC) | Enterprise tier | `[P2]` |
| Audit logs | Login, permission changes, data exports, deletions | `[MVP]` |

---

## 8.10 User Invitation Flow

```
Tenant Admin → Users → Invite User
    → Enter email + select role(s) + select module access
    → System sends invite email with secure link (expires 72h)
    → User clicks link → Set Password → Onboarding tour
    → User lands on role-appropriate dashboard
```

For Employee role: optionally link to existing Employee record in HRM.

---

## 8.11 Custom Roles `[Growth Tier+]`

Tenant Admins can create custom roles:

1. Clone a system role as starting point
2. Toggle individual permissions on/off
3. Assign module scope (which modules this role accesses)
4. Name and save
5. Assign to users

Restrictions:
- Cannot grant `platform:billing:manage` via custom role unless user is tenant_admin
- Cannot create roles with more permissions than the creator has
- Max 20 custom roles per tenant

---

## 8.12 Data Visibility Rules

| Rule | Description |
|------|-------------|
| **Tenant isolation** | Users never see data from other tenants |
| **Own vs. all** | Sales reps see own deals; managers see team/all |
| **Department scoping** | HR executives see employees in their department `[Configurable]` |
| **Field-level** | Salary fields visible only to hr_manager+ `[P1]` |
| **Soft delete** | Deleted records hidden from UI, retained 90 days, then purged |
| **Audit trail** | Permission changes logged with who, when, what changed |

---

**Previous:** [07 — SaaS Business Model](./07-saas-business-model.md)  
**Next:** [09 — Design Philosophy & Tokens](./09-design-philosophy-tokens.md)
