# Chapter 5 — Lead Conversion Workflow

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 5  
**Version:** 1.0.0-draft

---

## 5.1 Overview

**Conversion** transforms a qualified Lead into persistent CRM records: Contact, Company (optional), and Deal (optional). This is the critical handoff from marketing/top-of-funnel to active sales pipeline.

**Trigger:** User clicks **"Convert Lead"** on lead detail (only when status = `qualified` or manager override).

---

## 5.2 Conversion Modal UI

```
┌─────────────────────────────────────────────────┐
│ Convert Lead: Rajesh Kumar                  [×] │
├─────────────────────────────────────────────────┤
│ ☑ Create Contact                                │
│   First Name: [Rajesh    ] Last: [Kumar     ]   │
│   Email: [rajesh@techcorp.com]                  │
│                                                 │
│ ☑ Create Company                                │
│   ○ Link existing: [Search companies...    ]    │
│   ● Create new: [TechCorp Pvt Ltd            ]  │
│                                                 │
│ ☑ Create Deal                                   │
│   Deal Name: [TechCorp - Enterprise License ]   │
│   Pipeline:  [Default Pipeline ▾]              │
│   Stage:     [Qualification ▾]                 │
│   Amount:    [₹ 2,50,000    ]                  │
│   Close Date:[2026-08-15    ]                  │
│                                                 │
│ ☐ Transfer open activities to Deal              │
│ ☐ Transfer notes and documents to Deal        │
│                                                 │
│              [Cancel]  [Convert Lead]           │
└─────────────────────────────────────────────────┘
```

---

## 5.3 Conversion Options Matrix

| Option | Default | Required |
|--------|---------|----------|
| Create Contact | ✅ checked | At least Contact OR link existing contact |
| Create Company | ✅ checked if company_name exists | Optional |
| Link existing Company | — | Alternative to create |
| Create Deal | ✅ checked | Optional |
| Transfer activities | ✅ checked | Optional |
| Transfer notes/docs | ✅ checked | Optional |

---

## 5.4 Business Rules

| Rule | Description |
|------|-------------|
| LC-001 | Lead status must be `qualified` OR user has `sales_manager+` override |
| LC-002 | Contact email must not duplicate existing contact (warn + link option) |
| LC-003 | On success: lead.status = `converted`, `converted_at` = now |
| LC-004 | Lead record preserved (not deleted) — read-only after conversion |
| LC-005 | Converted lead detail shows links to Contact, Company, Deal |
| LC-006 | Deal owner defaults to lead owner |
| LC-007 | All conversion steps in single DB transaction — rollback on any failure |
| LC-008 | Activity created: "Lead converted to deal TechCorp Enterprise" |

---

## 5.5 API

**POST** `/api/v1/crm/leads/:id/convert`

```json
{
  "create_contact": true,
  "contact": {
    "first_name": "Rajesh",
    "last_name": "Kumar",
    "email": "rajesh@techcorp.com",
    "phone": "+919876543210"
  },
  "create_company": true,
  "company": {
    "name": "TechCorp Pvt Ltd"
  },
  "link_company_id": null,
  "create_deal": true,
  "deal": {
    "title": "TechCorp - Enterprise License",
    "pipeline_id": "uuid",
    "stage_id": "uuid",
    "amount": 250000,
    "expected_close_date": "2026-08-15"
  },
  "transfer_activities": true,
  "transfer_notes": true,
  "transfer_documents": true
}
```

**Response 200:**

```json
{
  "lead_id": "uuid",
  "contact_id": "uuid",
  "company_id": "uuid",
  "deal_id": "uuid",
  "redirect_url": "/crm/deals/uuid"
}
```

---

## 5.6 Post-Conversion UX

1. Toast: "Lead converted successfully"
2. Redirect to new Deal detail (if deal created) or Contact detail
3. Lead detail page shows banner: "This lead was converted on 12 Jul 2026" with links

---

## 5.7 Edge Cases

| Case | Handling |
|------|----------|
| Contact email already exists | Modal: "Contact exists — link to existing?" |
| Company name fuzzy match | Suggest existing companies (> 85% similarity) |
| Lead already converted | Button disabled; 409 on API |
| Deal creation fails mid-transaction | Full rollback; error toast |
| Lead with no company_name | Uncheck company by default |
| Manager converts unqualified lead | Allowed with audit log |

---

## 5.8 Acceptance Criteria

- [ ] Conversion completes in < 2 seconds
- [ ] All related records visible immediately after conversion
- [ ] Activities appear on Deal timeline if transfer selected
- [ ] Lead list filters exclude converted by default (toggle to show)
- [ ] Permission: `crm:lead:convert` required

---

**Next:** [06 — CSV Import](./06-lead-import-csv.md)
