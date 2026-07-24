# Chapter 10 — Unified Timeline

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 10  
**Version:** 1.0.0-draft

---

## 10.1 Purpose

The **Timeline** is a chronological, filterable feed of every interaction and system event for a Contact or Company. It is the narrative of the relationship — core to Contact 360 and Company 360.

---

## 10.2 Timeline Event Types

| Category | Types | Icon |
|----------|-------|------|
| **Communication** | call, email, meeting, whatsapp | phone, mail, calendar, message |
| **CRM** | deal_created, deal_stage_changed, deal_won, deal_lost | dollar |
| **Revenue** | quote_sent, invoice_sent, payment_received | file, receipt |
| **Tasks** | task_created, task_completed | check |
| **Notes** | note_added | edit |
| **Documents** | document_uploaded | paperclip |
| **System** | contact_created, owner_changed, status_changed, merged | gear |
| **AI** | ai_suggestion, ai_email_drafted | sparkles `[P1]` |

---

## 10.3 Data Model

Uses shared `activities` table (Part 5) with extensions:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | |
| `tenant_id` | UUID | |
| `record_type` | ENUM | contact, company, deal, ... |
| `record_id` | UUID | |
| `related_contact_id` | UUID | For company timeline: show contact context |
| `related_company_id` | UUID | For contact timeline: show company context |
| `type` | VARCHAR(50) | Event type |
| `subject` | VARCHAR(255) | |
| `description` | TEXT | |
| `metadata` | JSONB | Type-specific payload |
| `occurred_at` | TIMESTAMP | When it happened (default created_at) |
| `created_by` | UUID | |
| `is_pinned` | BOOLEAN | Pin to top `[P1]` |

---

## 10.4 Company Timeline Aggregation

Company 360 Timeline includes:
- Activities on company record
- Activities on all linked contacts (rollup)
- Deals, invoices, payments for company
- Optional filter: "This contact only" dropdown

```
┌────────────────────────────────────────────────────────────┐
│ Timeline                    [Filter ▾] [All contacts ▾]    │
├────────────────────────────────────────────────────────────┤
│ ● Today                                                    │
│   2:30 PM  Call logged by Amit — John Smith               │
│            "Discussed Q3 renewal" · 15 min · Connected     │
│   11:00 AM Deal stage changed — Acme Enterprise            │
│            Negotiation → Proposal · by Priya               │
│ ● Yesterday                                                │
│   4:00 PM  Invoice INV-0042 sent · ₹2,50,000 + GST        │
└────────────────────────────────────────────────────────────┘
```

---

## 10.5 UI Flow — Log Call from Timeline

```
Timeline tab → + Log Activity → Call
  → Fill form → Save
  → New entry appears at top (optimistic)
  → contact.last_contacted_at updated
  → Audit + activity record
```

---

## 10.6 Filters

| Filter | Options |
|--------|---------|
| Activity type | Multi-select |
| User | Who logged |
| Date range | Presets + custom |
| Contact (company view) | Specific contact or all |
| Pinned only | Toggle `[P1]` |

---

## 10.7 API Contract

**GET** `/api/v1/crm/contacts/:id/timeline?page=1&limit=20&type=call,email&from=2026-07-01`

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "call",
      "subject": "Follow-up call",
      "description": "Discussed Q3 renewal",
      "metadata": { "duration_minutes": 15, "outcome": "connected" },
      "occurred_at": "2026-07-20T09:00:00Z",
      "created_by": { "id": "uuid", "name": "Amit Sharma" },
      "related_deal": { "id": "uuid", "title": "Acme Enterprise" }
    }
  ],
  "meta": { "total": 156, "page": 1, "has_more": true }
}
```

---

## 10.8 Tenant Scope

Timeline queries always filter `tenant_id`; polymorphic record must belong to tenant.

---

## 10.9 Permissions

| Action | Permission |
|--------|------------|
| View timeline | Same as parent record read |
| Log activity | `crm:activity:create` |
| Delete activity | `crm:activity:delete` (own) or admin |
| Pin activity `[P1]` | `crm:activity:update` |

---

## 10.10 Audit Log

Activity deletions logged separately; system events immutable (no delete).

---

## 10.11 Responsive

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Full timeline with left date gutter |
| Tablet | Same, narrower |
| Mobile | Compact cards; expand for description; filter in bottom sheet |

---

## 10.12 Acceptance Criteria

- [ ] Timeline loads 20 items with infinite scroll
- [ ] Events grouped by day (Today, Yesterday, dates)
- [ ] Company timeline rolls up contact activities
- [ ] Filter by type works without full page reload
- [ ] System events (owner change, status) appear automatically
- [ ] last_contacted_at updates on call/email/meeting
- [ ] Timeline tab deep-link: `?tab=timeline`

---

**Next:** [11 — Communication Center](./11-contact-communication-center.md)
