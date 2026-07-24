# Chapter 9 — Activities, Notes & Attachments (Leads)

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 9  
**Version:** 1.0.0-draft

---

## 9.1 Activity Timeline

Unified chronological feed on lead detail (and all CRM records). Full activity spec in Part 5; lead-specific rules here.

### Activity Types on Leads

| Type | Code | Created By |
|------|------|------------|
| Call | `call` | User manual |
| Email | `email` | User manual / email sync `[P1]` |
| Meeting | `meeting` | User manual |
| Task | `task` | User manual |
| Note | `note` | User manual |
| Status Change | `status_change` | System |
| Assignment | `assignment` | System |
| Conversion | `conversion` | System |

---

## 9.2 Log Activity UI

**Quick action:** "Log Activity" dropdown on lead header

```
┌─────────────────────────────────┐
│ Log Activity                    │
├─────────────────────────────────┤
│ Type: [Call ▾]                  │
│ Subject: [Follow-up call     ]  │
│ Date/Time: [Today 2:00 PM    ]  │
│ Duration: [15 min ▾]            │
│ Outcome: [Connected ▾]          │
│ Description:                    │
│ [                             ] │
│                                 │
│ ☑ Schedule follow-up task       │
│   Due: [Tomorrow           ]    │
│                                 │
│         [Cancel]  [Save]        │
└─────────────────────────────────┘
```

---

## 9.3 Notes

- Rich text editor (bold, italic, lists, links) — Notion-inspired minimal toolbar
- @mention team members `[P1]` → notification
- Notes pinned to top `[P1]`
- Max 50,000 chars per note
- Notes searchable in global search `[P1]`

**Entity:** `notes` table, polymorphic `record_type=lead`

---

## 9.4 Document Attachments

| Attribute | Spec |
|-----------|------|
| Max file size | 25 MB per file |
| Max files per lead | 50 |
| Allowed types | PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, CSV |
| Storage | S3: `{tenant_id}/crm/leads/{lead_id}/{filename}` |
| Virus scan | ClamAV on upload `[P1]` |
| Preview | In-browser PDF/image preview |

### Upload UX

Drag-drop zone on Documents tab + "Upload" button. Progress bar per file.

---

## 9.5 Activity Data Model (Summary)

**Table:** `activities`

| Column | Type |
|--------|------|
| id | UUID |
| tenant_id | UUID |
| record_type | ENUM (lead, contact, company, deal, ...) |
| record_id | UUID |
| type | ENUM |
| subject | VARCHAR(255) |
| description | TEXT |
| due_at | TIMESTAMP (tasks/meetings) |
| completed_at | TIMESTAMP |
| duration_minutes | INT (calls/meetings) |
| outcome | VARCHAR(50) |
| created_by | UUID |
| created_at | TIMESTAMP |

---

## 9.6 Transfer on Conversion

When lead converts with transfer flags:
- Activities copied to Deal (and Contact) with `origin_lead_id` reference
- Notes copied with "Transferred from lead" prefix
- Documents S3 paths copied (or referenced)

---

**Next:** [10 — Lead Technical Spec & Acceptance](./10-lead-technical-spec.md)
