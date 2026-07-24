# Chapter 7 — Duplicate Detection & Merge

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 7  
**Version:** 1.0.0-draft

---

## 7.1 Detection Triggers

Duplicate check runs on:

1. Lead create (manual, API, web form)
2. Lead update (email or phone change)
3. CSV import (batch)
4. Scheduled scan `[P1]` — nightly job for missed duplicates

---

## 7.2 Matching Rules

| Priority | Match Criteria | Confidence |
|----------|----------------|------------|
| 1 | Exact email match (case-insensitive) | 100% |
| 2 | Exact phone match (normalized digits) | 95% |
| 3 | Email domain + same last_name + same company | 75% `[P1]` |
| 4 | Fuzzy name + same company (> 90% similarity) | 70% `[P1]` |

**MVP:** Rules 1 and 2 only.

---

## 7.3 Duplicate Modal (On Create)

```
┌─────────────────────────────────────────────────┐
│ ⚠ Possible Duplicate Found                  [×] │
├─────────────────────────────────────────────────┤
│ A lead with this email already exists:          │
│                                                 │
│ Rajesh Kumar · rajesh@techcorp.com              │
│ Status: Contacted · Owner: Amit                 │
│ Created: 5 Jul 2026                             │
│                                                 │
│ [View Existing Lead]  [Create Anyway]  [Cancel] │
└─────────────────────────────────────────────────┘
```

---

## 7.4 Merge Workflow `[P1]`

**Route:** Lead detail → More → Merge with...

```
Select primary record (keep) vs secondary (absorb)
    → Preview field merge (primary wins on conflict, or pick per field)
    → Merge activities, notes, documents from secondary to primary
    → Soft-delete secondary record
    → Audit log entry
```

**Permission:** `crm:lead:update_all` (sales_manager+)

---

## 7.5 Duplicate Management Dashboard `[P1]`

**Route:** `/crm/settings/duplicates`

- List of suspected duplicate pairs with confidence score
- Bulk merge or dismiss
- Run manual scan button

---

## 7.6 API

**POST** `/api/v1/crm/leads/check-duplicate`

```json
{ "email": "rajesh@techcorp.com", "phone": "9876543210" }
```

**Response:**

```json
{
  "has_duplicate": true,
  "matches": [
    { "id": "uuid", "name": "Rajesh Kumar", "email": "...", "confidence": 100, "match_field": "email" }
  ]
}
```

---

## 7.7 Business Rules

| Rule | Description |
|------|-------------|
| DD-001 | Duplicate check scoped to tenant only |
| DD-002 | Converted leads excluded from duplicate suggestions as merge targets |
| DD-003 | Create Anyway requires explicit user click — never silent duplicate |
| DD-004 | Merge is irreversible (admin restore from audit `[P2]`) |

---

**Next:** [08 — Assignment Rules](./08-assignment-rules.md)
