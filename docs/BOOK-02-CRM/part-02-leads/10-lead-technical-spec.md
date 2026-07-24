# Chapter 10 — Lead APIs & Acceptance Criteria

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 10  
**Version:** 1.0.0-draft

---

## 10.1 REST API Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/v1/crm/leads` | `crm:lead:read` | List with pagination, filters, sort |
| POST | `/api/v1/crm/leads` | `crm:lead:create` | Create lead |
| GET | `/api/v1/crm/leads/:id` | `crm:lead:read` | Get lead detail |
| PATCH | `/api/v1/crm/leads/:id` | `crm:lead:update` | Update lead |
| DELETE | `/api/v1/crm/leads/:id` | `crm:lead:delete` | Soft delete |
| POST | `/api/v1/crm/leads/:id/convert` | `crm:lead:convert` | Convert lead |
| POST | `/api/v1/crm/leads/check-duplicate` | `crm:lead:create` | Duplicate check |
| PATCH | `/api/v1/crm/leads/bulk-assign` | `crm:lead:assign` | Bulk assign |
| PATCH | `/api/v1/crm/leads/bulk-status` | `crm:lead:update_all` | Bulk status |
| DELETE | `/api/v1/crm/leads/bulk` | `crm:lead:delete_all` | Bulk delete |
| POST | `/api/v1/crm/leads/import` | `crm:lead:import` | CSV import |
| GET | `/api/v1/crm/leads/export` | `crm:lead:export` | CSV export |
| POST | `/api/public/v1/leads` | API key | Public web form |

---

## 10.2 List Query Parameters

```
GET /api/v1/crm/leads?page=1&limit=25&sort=-created_at
  &status=new,contacted
  &source=website
  &owner_id=uuid
  &rating=hot
  &search=rajesh
  &created_from=2026-07-01
  &created_to=2026-07-31
```

**Response:**

```json
{
  "data": [ { "id": "...", "first_name": "Rajesh", ... } ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 25,
    "total_pages": 6
  }
}
```

---

## 10.3 Error Codes

| HTTP | Code | When |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid fields |
| 403 | `PERMISSION_DENIED` | Missing permission |
| 403 | `MODULE_DISABLED` | CRM not in plan |
| 404 | `LEAD_NOT_FOUND` | Invalid id or wrong tenant |
| 409 | `ALREADY_CONVERTED` | Convert on converted lead |
| 409 | `DUPLICATE_EMAIL` | Strict duplicate mode `[Optional]` |
| 422 | `INVALID_STATUS_TRANSITION` | Illegal status change |

---

## 10.4 Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Create lead with only phone | Success |
| Create lead with neither email nor phone | 400 validation error |
| Convert without deal | Contact (+ company) created; deal_id null |
| Delete converted lead | 403 — converted leads cannot be deleted |
| Import CSV with UTF-8 BOM | Handled correctly |
| Assign to deactivated user | 400 "User is inactive" |
| 10 concurrent creates same email | First wins; others get duplicate modal |
| Lead owner deleted (user removed) | owner_id set null; appears in unassigned queue |
| Timezone on due_at activities | Stored UTC; displayed in user timezone |

---

## 10.5 Part 2 Acceptance Criteria (Sign-off)

### Functional
- [ ] CRUD leads with all fields
- [ ] Status flow enforced per transition matrix
- [ ] Convert creates Contact + Company + Deal atomically
- [ ] CSV import 1000 rows with duplicate skip
- [ ] Round-robin assignment on create
- [ ] Duplicate detection on email and phone
- [ ] Activity timeline with manual + system activities
- [ ] Notes and document upload on lead detail
- [ ] Permission enforcement on all endpoints
- [ ] sales_rep scope limited to own leads

### Non-Functional
- [ ] List API p95 < 300ms for 10K leads
- [ ] Duplicate check < 200ms
- [ ] Import 1000 rows < 60s
- [ ] All strings sanitized (XSS prevention)
- [ ] tenant_id enforced on every query

### UI
- [ ] List, detail, create, import screens match wireframes
- [ ] Empty states on zero leads
- [ ] Mobile card view on < 768px
- [ ] Toast on all successful mutations

---

**Part 2 Complete.**  
**Next Part:** [Part 3 — Contacts & Companies](../part-03-contacts/README.md)
