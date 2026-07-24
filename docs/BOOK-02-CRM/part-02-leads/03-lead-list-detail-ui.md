# Chapter 3 — Lead List & Detail UI

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 3  
**Version:** 1.0.0-draft

---

## 3.1 Lead List Page (`/crm/leads`)

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Leads (142)          [Search...] [Filters ▾] [Import] [+ Lead] │
├─────────────────────────────────────────────────────────────────┤
│ ☐ │ Name          │ Company    │ Source   │ Status │ Owner │ ⋮  │
│───┼───────────────┼────────────┼──────────┼────────┼───────┼────│
│ ☐ │ Rajesh Kumar  │ TechCorp   │ Website  │ New    │ Amit  │ ⋮  │
│ ☐ │ Sneha Patel   │ —          │ Referral │ Contact│ Priya │ ⋮  │
├─────────────────────────────────────────────────────────────────┤
│ Bulk: [Assign ▾] [Change Status ▾] [Delete]     Page 1 of 8  ◂▸│
└─────────────────────────────────────────────────────────────────┘
```

### Table Columns (Default)

| Column | Sortable | Filterable |
|--------|----------|------------|
| Checkbox | — | — |
| Name (first + last) | ✅ | Search |
| Company | ✅ | Text |
| Email | ❌ | Search |
| Phone | ❌ | — |
| Source | ✅ | Multi-select |
| Status | ✅ | Multi-select |
| Rating | ✅ | Multi-select |
| Owner | ✅ | User select |
| Created | ✅ | Date range |
| Actions (⋮) | — | — |

### Row Actions Menu

- View
- Edit
- Assign
- Change Status
- Convert
- Delete (soft)

### Filters Panel

| Filter | Type |
|--------|------|
| Status | Multi-select chips |
| Source | Multi-select |
| Owner | User dropdown + "Unassigned" |
| Rating | Hot / Warm / Cold |
| Created Date | Date range picker |
| Has Email | Yes/No |
| Custom fields | Dynamic `[P1]` |

**Saved Views `[P1]`:** "My New Leads", "Unassigned This Week", "Hot Leads"

---

## 3.2 Lead Detail Page (`/crm/leads/:id`)

### Header Card

```
┌─────────────────────────────────────────────────────────────────┐
│ CRM > Leads > Rajesh Kumar                                      │
├─────────────────────────────────────────────────────────────────┤
│ [RK]  Rajesh Kumar          [New ▾]  [🔥 Hot]                   │
│       TechCorp · CTO                                            │
│       rajesh@techcorp.com · +91 98765 43210                     │
│                                                                 │
│ [Convert Lead]  [Edit]  [Assign ▾]  [Log Activity ▾]  [⋮ More] │
├─────────────────────────────────────────────────────────────────┤
│ Owner: Amit  │  Source: Website  │  Created: 12 Jul 2026        │
│ Expected Value: ₹2,50,000                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Tabs

| Tab | Content |
|-----|---------|
| **Overview** | All fields, address, UTM data, custom fields |
| **Activities** | Timeline: calls, emails, meetings, status changes |
| **Notes** | Rich-text notes list + add note |
| **Documents** | File attachments with preview |
| **Related** | Linked contact/company/deal post-conversion |

### Status Dropdown (Header)

Inline status change dropdown — updates immediately with toast + activity log entry.

---

## 3.3 Create / Edit Lead Form

**Modal (quick create)** or **full page (`/crm/leads/new`)**

Sections:
1. **Contact Info** — name, email, phone, job title
2. **Company Info** — company name, website, industry `[P1]`
3. **Lead Details** — source, rating, expected value, description
4. **Assignment** — owner (optional; rule applies if blank)
5. **Address** — collapsible advanced section

### Validation (Client + Server)

| Field | Rule | Error Message |
|-------|------|---------------|
| first_name | Required, 1–100 chars | "First name is required" |
| email | Valid format if provided | "Enter a valid email address" |
| phone | 10 digits min if provided | "Enter a valid phone number" |
| email OR phone | At least one | "Email or phone is required" |
| source | Required | "Select a lead source" |
| expected_value | ≥ 0 | "Value cannot be negative" |

On save: duplicate check modal if match found (see Chapter 7).

---

## 3.4 UX Flows

### Flow: Create Lead

```
Click "+ Lead" → Form modal opens → Fill fields → Click Save
    → Duplicate check API
        → Match found? → Show duplicate modal (Create anyway / View existing / Cancel)
        → No match → Create lead → Assignment rule runs → Toast "Lead created"
        → Navigate to lead detail
```

### Flow: Bulk Assign

```
Select rows → Bulk Assign → Pick user → Confirm
    → API PATCH /leads/bulk-assign → Toast "5 leads assigned to Priya"
```

---

## 3.5 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Full table with all columns |
| Tablet | Hide email, phone columns; show in row expand |
| Mobile | Card list view; swipe actions for call/email |

---

## 3.6 Acceptance Criteria

- [ ] List paginated at 25 rows default (options: 25, 50, 100)
- [ ] Sort persists in URL query params
- [ ] sales_rep sees only own leads unless read_all permission
- [ ] Empty state with CTA when zero leads
- [ ] Lead detail loads in < 500ms
- [ ] Convert button hidden if status = converted

---

**Next:** [04 — Lead Status Flow](./04-lead-status-flow.md)
