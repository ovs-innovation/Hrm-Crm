# Chapter 6 — CSV Import & Bulk Operations

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 6  
**Version:** 1.0.0-draft

---

## 6.1 Import Wizard Flow

```
Step 1: Upload CSV
    ↓
Step 2: Column Mapping (auto-detect + manual override)
    ↓
Step 3: Validation Preview (errors highlighted per row)
    ↓
Step 4: Duplicate Review (skip / update / create anyway)
    ↓
Step 5: Import Summary → Background job for > 500 rows
    ↓
Step 6: Results Report (created, skipped, failed counts)
```

**Route:** `/crm/leads/import`  
**Permission:** `crm:lead:import`

---

## 6.2 CSV Template

Downloadable template columns:

| Column | Required | Example |
|--------|----------|---------|
| first_name | ✅ | Rajesh |
| last_name | ❌ | Kumar |
| email | ✅* | rajesh@techcorp.com |
| phone | ✅* | 9876543210 |
| company_name | ❌ | TechCorp |
| job_title | ❌ | CTO |
| source | ❌ | Website (defaults to `import`) |
| rating | ❌ | hot / warm / cold |
| expected_value | ❌ | 250000 |
| description | ❌ | Met at conference |
| owner_email | ❌ | amit@company.com (assign to user) |

---

## 6.3 Validation Rules (Import)

| Rule | Action on Fail |
|------|----------------|
| Missing first_name | Row error — skip row |
| Invalid email format | Row error — skip row |
| Both email and phone empty | Row error — skip row |
| Invalid source | Default to `import`, warn |
| Invalid owner_email | Leave unassigned, warn |
| Duplicate email in file | Keep first, skip subsequent |
| Row count > 10,000 | Reject file |

---

## 6.4 Duplicate Handling on Import

| Option | Behavior |
|--------|----------|
| **Skip duplicates** | Don't create if email/phone matches existing lead |
| **Update existing** | Update empty fields on existing lead only |
| **Create anyway** | Create new lead even if duplicate (not recommended) |

Default: **Skip duplicates** with summary count.

---

## 6.5 Bulk Operations (List Page)

| Operation | API | Permission |
|-----------|-----|------------|
| Bulk assign owner | `PATCH /api/v1/crm/leads/bulk-assign` | `crm:lead:assign` |
| Bulk status change | `PATCH /api/v1/crm/leads/bulk-status` | `crm:lead:update_all` |
| Bulk delete | `DELETE /api/v1/crm/leads/bulk` | `crm:lead:delete_all` |
| Bulk export | `GET /api/v1/crm/leads/export?ids=` | `crm:lead:export` |

Max 500 records per bulk operation.

---

## 6.6 Background Job (Large Imports)

Imports > 500 rows queued via BullMQ:

- User receives email on completion
- Progress bar in UI: "Importing 2,340 leads... 67%"
- Import history log in Settings → Import History

---

## 6.7 Acceptance Criteria

- [ ] Sample CSV template downloadable
- [ ] 1,000 row import completes in < 60 seconds
- [ ] Validation preview shows row-level errors before commit
- [ ] Import audit log: who, when, file name, counts

---

**Next:** [07 — Duplicate Detection & Merge](./07-duplicate-detection.md)
