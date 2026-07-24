# Chapter 4 — Contact List UI

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 4  
**Version:** 1.0.0-draft

---

## 4.1 Route & Permission

| Route | Permission |
|-------|------------|
| `/crm/contacts` | `crm:contact:read` or `crm:contact:read_all` |

**Scope:** sales_rep sees contacts where `owner_id = self` OR linked to own deals `[P1]`; read_all sees entire tenant.

---

## 4.2 Screen Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Contacts (1,248)    [🔍 Search...] [Filters ▾] [Views ▾] [Import] [+ Contact] │
├──────────────────────────────────────────────────────────────────────────┤
│ ☐ │ Name           │ Company      │ Email           │ Phone    │ Owner │ Status │ ⋮ │
│───┼────────────────┼──────────────┼─────────────────┼──────────┼───────┼────────┼───│
│ ☐ │ John Smith     │ ABC Pvt Ltd  │ john@abc.com    │ +91…     │ Amit  │ Active │ ⋮ │
│ ☐ │ Sneha Patel    │ TechCorp     │ sneha@…         │ +91…     │ Priya │ Active │ ⋮ │
├──────────────────────────────────────────────────────────────────────────┤
│ Bulk: [Assign] [Add Tag] [Export]              Rows: 25 ▾    Page 1/50 ◂▸ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4.3 Table Columns

| Column | Sort | Filter | Default Visible |
|--------|------|--------|-----------------|
| Checkbox | — | — | ✅ |
| Name (avatar + full name) | ✅ | Search | ✅ |
| Company (primary) | ✅ | Company select | ✅ |
| Email | ❌ | Search | ✅ |
| Phone | ❌ | — | Desktop only |
| Job Title | ✅ | — | ❌ |
| Owner | ✅ | User | ✅ |
| Status | ✅ | Multi | ✅ |
| Tags | ❌ | Tag | ✅ |
| Lead Score | ✅ | Range `[P1]` | ❌ |
| Last Activity | ✅ | Date range | ✅ |
| Created | ✅ | Date range | ❌ |

---

## 4.4 Filters Panel

| Filter | Type |
|--------|------|
| Status | active, inactive, churned, dnc |
| Owner | User + Unassigned |
| Company | Autocomplete search |
| Tags | Multi-select |
| Segment | Saved segment `[Ch.9]` |
| Industry (via company) | Multi-select |
| Last activity | Last 7/30/90 days, custom |
| Has open deal | Yes/No `[requires Part 4]` |
| Custom fields | Dynamic `[P1]` |

**Saved Views:** My Contacts, All Active, No Activity 30 Days, Enterprise Tags

---

## 4.5 Row Actions

- View profile (360)
- Edit
- Log activity
- Send email `[P1]`
- Assign owner
- Add tag
- Merge `[P1]`
- Delete

---

## 4.6 Company List (`/crm/companies`)

Parallel list page for companies:

| Column | Description |
|--------|-------------|
| Name | Company name + parent indicator if subsidiary |
| Industry | |
| Status | prospect / customer badge |
| Contacts | Count of linked contacts |
| Open Deals | Count + value `[Part 4]` |
| Owner | Account owner |
| GSTIN | Masked last 4 chars on list |
| Last Activity | |

Filters: status, industry, owner, parent company, revenue range, employee count range.

---

## 4.7 UI Flow — Search Contact

```
User types in search → debounce 300ms → GET /contacts?search=john
  → Results update in table
  → Highlight match in name/email
  → Empty: "No contacts match 'john'. [Clear filters]"
```

Global `⌘K` also searches contacts (Book 1).

---

## 4.8 UI Flow — Bulk Tag

```
Select rows → Bulk → Add Tag → Pick/create tag → Apply
  → PATCH /contacts/bulk-tags
  → Toast "Tag added to 12 contacts"
  → Audit: bulk_tag_applied
```

---

## 4.9 API Contract — List Contacts

**GET** `/api/v1/crm/contacts?page=1&limit=25&sort=-last_activity_at&status=active&search=john&tags=enterprise`

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john@abc.com",
      "phone": "+919876543210",
      "status": "active",
      "owner": { "id": "uuid", "name": "Amit Sharma" },
      "primary_company": { "id": "uuid", "name": "ABC Pvt Ltd" },
      "tags": ["enterprise"],
      "last_activity_at": "2026-07-19T10:00:00Z"
    }
  ],
  "meta": { "total": 1248, "page": 1, "limit": 25, "total_pages": 50 }
}
```

---

## 4.10 Tenant Scope

List endpoint never returns cross-tenant records. Search indexed per tenant.

---

## 4.11 Permissions

| UI Element | Permission |
|------------|------------|
| + Contact | `crm:contact:create` |
| Import | `crm:contact:import` |
| Export | `crm:contact:export` |
| Bulk assign | `crm:contact:update_all` |
| Delete | `crm:contact:delete_all` |

---

## 4.12 Audit Log

Bulk operations log single audit entry with `{ action, contact_ids[], user_id, count }`.

---

## 4.13 Responsive

| Breakpoint | Contacts | Companies |
|------------|----------|-----------|
| **Desktop** (>1024px) | Full table, all default columns | Full table |
| **Tablet** (768–1024px) | Hide phone, job title; filters in drawer | Hide GSTIN, contact count |
| **Mobile** (<768px) | Card list: name, company, status, tap → 360 | Card list: name, status, industry |

### Mobile Contact Card

```
┌─────────────────────────────┐
│ [JS] John Smith      Active │
│ ABC Pvt Ltd · Senior Manager│
│ john@abc.com                │
│ Last activity: 2 days ago   │
└─────────────────────────────┘
```

Swipe actions `[P1]`: Call, Email, Activity

---

## 4.14 Empty States

| State | Message | CTA |
|-------|---------|-----|
| Zero contacts | No contacts yet | + Create Contact, Import CSV |
| Filter empty | No results match filters | Clear filters |
| Permission empty | No contacts assigned to you | Contact manager |

---

## 4.15 Acceptance Criteria

- [ ] Paginated list with sort on name, last_activity, created
- [ ] Filters persist in URL query string
- [ ] sales_rep scoping enforced server-side
- [ ] Bulk assign and bulk tag work for up to 500 records
- [ ] Company list page at `/crm/companies` with parallel features
- [ ] Mobile card view functional < 768px
- [ ] List API p95 < 400ms for 10K contacts

---

**Next:** [05 — Contact Profile 360](./05-contact-profile-360.md)
