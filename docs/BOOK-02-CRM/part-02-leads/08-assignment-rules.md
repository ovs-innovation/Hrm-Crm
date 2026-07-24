# Chapter 8 — Assignment Rules

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 8  
**Version:** 1.0.0-draft

---

## 8.1 Overview

Assignment rules automatically set `owner_id` on new leads when no owner is specified manually. Reduces unassigned queue and ensures fair distribution.

**Configuration:** `/crm/settings/automation` → Assignment Rules  
**Permission:** `crm:automation:manage`

---

## 8.2 Rule Types

| Type | Code | Description |
|------|------|-------------|
| Round Robin | `round_robin` | Cycle through selected reps |
| Load Based | `load_based` | Assign to rep with fewest open leads |
| Source Based | `source_based` | IF source = X THEN assign to user/team |
| Territory Based | `territory_based` | IF state/city matches territory `[P2]` |
| Manual Queue | `manual_queue` | Leave unassigned for manager pickup |

---

## 8.3 Round Robin (MVP)

```
Rule: Default Lead Assignment
Type: round_robin
Users: [Amit, Sneha, Vikram, Priya]
Skip offline users: true [P1]
```

**State stored:** `last_assigned_user_index` per rule in tenant config.

On new lead → next user in rotation → set owner → notify user.

---

## 8.4 Source-Based Rules (MVP)

```
IF source = 'website'     → Assign to Team Inbound [Amit, Sneha]
IF source = 'referral'    → Assign to Priya (fixed)
IF source = 'cold_call'   → Assign to creating user
ELSE                      → Fall through to round robin
```

Rules evaluated top-to-bottom; first match wins.

---

## 8.5 Rule Configuration UI

```
┌─────────────────────────────────────────────────┐
│ Assignment Rules                    [+ Rule]  │
├─────────────────────────────────────────────────┤
│ 1. IF source = Website                          │
│    THEN Round Robin → Amit, Sneha               │
│    [Edit] [Disable]                             │
│ 2. IF source = Referral                         │
│    THEN Assign to → Priya                       │
│ 3. DEFAULT                                      │
│    Round Robin → All Sales Reps                 │
└─────────────────────────────────────────────────┘
```

Drag to reorder priority.

---

## 8.6 Notifications on Assignment

| Channel | Content |
|---------|---------|
| In-app bell | "New lead assigned: Rajesh Kumar from TechCorp" |
| Email | Same + link to lead detail |
| Push `[P1]` | Mobile notification |

User can disable assignment emails in notification preferences.

---

## 8.7 Business Rules

| Rule | Description |
|------|-------------|
| AR-001 | Manual owner on create overrides all rules |
| AR-002 | Re-assignment does not trigger assignment rules again |
| AR-003 | Deactivated users excluded from round robin |
| AR-004 | Max 20 assignment rules per tenant |
| AR-005 | Unassigned leads visible in manager dashboard widget |

---

## 8.8 API

Rules stored in `crm_assignment_rules` table; evaluated in lead create service.

**GET** `/api/v1/crm/settings/assignment-rules`  
**POST** `/api/v1/crm/settings/assignment-rules`  
**PUT** `/api/v1/crm/settings/assignment-rules/:id`  
**DELETE** `/api/v1/crm/settings/assignment-rules/:id`

---

**Next:** [09 — Activities, Notes & Attachments](./09-activities-notes-attachments.md)
