# Chapter 4 — Lead Status Flow & Lifecycle

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 4  
**Version:** 1.0.0-draft

---

## 4.1 Status Definitions

| Status | Code | Description | Terminal |
|--------|------|-------------|----------|
| New | `new` | Just captured, not yet contacted | ❌ |
| Contacted | `contacted` | Rep has made first outreach | ❌ |
| Qualified | `qualified` | Meets BANT/criteria, ready to convert | ❌ |
| Unqualified | `unqualified` | Does not fit ICP | ✅ |
| Converted | `converted` | Successfully converted to Contact/Deal | ✅ |
| Lost | `lost` | Prospect lost to competitor or no interest | ✅ |

---

## 4.2 Status Transition Diagram

```
                    ┌──────────────┐
                    │     NEW      │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐  ┌──────────┐  ┌──────────────┐
       │CONTACTED │  │UNQUALIFIED│  │    LOST      │
       └────┬─────┘  └──────────┘  └──────────────┘
            │
     ┌──────┼──────┐
     ▼      ▼      ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│QUALIFIED│ │UNQUALIFIED│ │  LOST  │
└────┬────┘ └─────────┘ └─────────┘
     │
     ▼
┌──────────┐
│ CONVERTED│ (terminal — via conversion workflow only)
└──────────┘
```

---

## 4.3 Transition Rules

| From | To | Allowed | Requires |
|------|-----|---------|----------|
| new | contacted | ✅ | — |
| new | unqualified | ✅ | Reason `[P1]` |
| new | lost | ✅ | Lost reason |
| contacted | qualified | ✅ | — |
| contacted | unqualified | ✅ | Reason |
| contacted | lost | ✅ | Lost reason |
| qualified | converted | ✅ | Conversion workflow only |
| qualified | lost | ✅ | Lost reason |
| * | converted | ❌ | Must use Convert action |
| converted | * | ❌ | Terminal state |
| unqualified | contacted | ✅ | Re-open `[P1]` |
| lost | contacted | ✅ | Re-open `[P1]` |

---

## 4.4 Lost / Unqualified Reasons

Configurable list in CRM Settings:

**Lost Reasons (default):**
- Chose competitor
- Budget constraints
- No response / ghosted
- Not a fit
- Timing not right
- Other

**Unqualified Reasons (default):**
- Wrong industry
- Too small
- Wrong geography
- Spam / invalid
- Duplicate
- Other

Required when moving to `lost` or `unqualified` (modal prompt).

---

## 4.5 Lead Rating

Independent of status — indicates priority:

| Rating | Badge Color | Meaning |
|--------|-------------|---------|
| Hot | Red/orange | High intent, act today |
| Warm | Yellow | Interested, follow up this week |
| Cold | Blue/gray | Low priority, nurture |

AI lead scoring can auto-set rating `[P1]` (Part 11).

---

## 4.6 SLA Rules `[P1]`

| Rule | Trigger | Action |
|------|---------|--------|
| First contact SLA | Lead in `new` > 4 hours | Notify owner + manager |
| Stale lead | No activity > 7 days in `contacted` | Flag in dashboard + email |
| Unassigned SLA | No owner > 1 hour | Notify sales_manager |

Configurable in Part 10 — Automation.

---

## 4.7 Activity Log on Status Change

Every status change creates system activity:

```json
{
  "type": "status_change",
  "subject": "Status changed from New to Contacted",
  "metadata": {
    "from_status": "new",
    "to_status": "contacted",
    "reason": null,
    "changed_by": "user_uuid"
  }
}
```

---

**Next:** [05 — Lead Conversion Workflow](./05-lead-conversion.md)
