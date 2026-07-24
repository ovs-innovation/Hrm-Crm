# Chapter 3 — CRM User Roles

**Book:** 2 — CRM PRD · **Part:** 1 — Foundation · **Chapter:** 3  
**Version:** 1.0.0-draft

---

## 3.1 CRM-Relevant Roles

CRM permissions extend the platform roles defined in [Book 1, Chapter 8](../../BOOK-01-MASTER-PRD/08-user-roles-permissions.md).

| Role | CRM Access Level | Primary CRM Tasks |
|------|------------------|-------------------|
| `tenant_admin` | Full | All CRM + settings + billing |
| `admin` | Full (no billing) | All CRM + user management |
| `sales_manager` | Team + config | Pipeline oversight, approvals, reports, assignment rules |
| `sales_rep` | Own records | Leads, deals, quotes, activities on assigned records |
| `finance_manager` | Invoices + payments | Invoice management, payment recording, credit notes |
| `viewer` | Read-only | View pipeline and reports (board/investor access) |
| `custom_*` | Configurable | Tenant-defined granular access |

**Note:** `hr_manager`, `employee`, and `client` roles have **no default CRM access** unless explicitly granted via custom role.

---

## 3.2 Role Capabilities Summary

### Sales Representative (`sales_rep`)

**Can:**
- Create, view, edit own leads, contacts, deals
- Log activities on own records
- Create quotations for own deals
- Send quotes (if below approval threshold)
- View own performance metrics

**Cannot:**
- View other reps' deals (unless shared/team `[P1]`)
- Approve quotes above threshold
- Void invoices
- Configure pipelines or assignment rules
- Delete any CRM record (soft-delete own leads only)
- Export all tenant CRM data

### Sales Manager (`sales_manager`)

**Can:**
- Everything sales_rep can, plus:
- View and edit **all** team deals and leads
- Reassign leads and deals
- Approve/reject quotations
- Configure pipeline stages (within tenant limits)
- Configure assignment rules
- View team reports and forecast
- Export CRM data (CSV)

**Cannot:**
- Void paid invoices
- Manage billing/subscription
- Delete audit logs

### Finance Manager (`finance_manager`)

**Can:**
- View all invoices and payments
- Create invoices from deals/quotes
- Record offline payments
- Issue credit notes
- Void draft/unpaid invoices
- View revenue reports

**Cannot:**
- Edit deal pipeline stages
- Create or convert leads
- Approve quotations (unless also sales_manager)

### Viewer (`viewer`)

**Can:**
- Read-only access to leads, contacts, companies, deals, reports
- No create, edit, delete, or export

---

## 3.3 Record Ownership Model

Every CRM record has an **Owner** (User ID):

| Entity | Owner | Reassignable By |
|--------|-------|-----------------|
| Lead | Assigned rep | sales_rep (own), sales_manager, admin |
| Contact | Creating user or assigned rep | sales_manager, admin |
| Company | Account owner | sales_manager, admin |
| Deal | Deal owner | sales_rep (own), sales_manager, admin |
| Quotation | Deal owner | sales_manager, admin |
| Invoice | Finance or deal owner | finance_manager, admin |

### Ownership Rules

1. Owner receives notifications for record updates and SLA breaches
2. `sales_rep` default scope: `owner_id = current_user.id`
3. `sales_manager` default scope: all records in tenant (or team if team scoping enabled `[P1]`)
4. Reassignment creates activity log entry: "Owner changed from X to Y by Z"

---

## 3.4 Team Scoping `[P1]`

Optional feature for larger sales teams:

```
Tenant
  └── Sales Team A (Manager: Priya)
        └── Reps: Amit, Sneha
  └── Sales Team B (Manager: Raj)
        └── Reps: Vikram, Meera
```

- `sales_manager` sees only their team's records when team scoping enabled
- `tenant_admin` sees all teams
- Assignment rules can target specific teams

---

## 3.5 Approval Authority Matrix

| Action | sales_rep | sales_manager | finance_manager | admin |
|--------|-----------|---------------|-----------------|-------|
| Quote < ₹1,00,000 | Send directly | Send | — | Send |
| Quote ≥ ₹1,00,000 | Submit for approval | Approve/Reject | — | Approve |
| Quote discount > 15% | Submit for approval | Approve/Reject | — | Approve |
| Invoice void (unpaid) | — | — | ✅ | ✅ |
| Invoice void (paid) | — | — | — | ✅ (+ audit) |
| Credit note issue | — | — | ✅ | ✅ |
| Refund process | — | — | ✅ | ✅ |
| Pipeline stage config | — | ✅ | — | ✅ |
| Lead assignment rule config | — | ✅ | — | ✅ |

*Thresholds configurable in CRM Settings (Part 10).*

---

## 3.6 Client Portal Role (CRM Context) `[P1]`

External **Client** users (`client` role) interact with CRM-generated artifacts:

| Can View | Can Do |
|----------|--------|
| Quotations sent to them | Accept/Reject quote |
| Invoices sent to them | Pay online (Razorpay link) |
| Payment receipts | Download PDF |
| Related project status | View (Projects module) |

Clients **cannot** access internal CRM records, pipeline, or other clients' data.

---

**Previous:** [02 — Business Goals](./02-business-goals.md)  
**Next:** [04 — CRM Permission Matrix](./04-crm-permission-matrix.md)
