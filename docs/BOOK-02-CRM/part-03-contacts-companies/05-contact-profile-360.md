# Chapter 5 — Contact Profile 360

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 5  
**Version:** 1.0.0-draft

---

## 5.1 Purpose

The **Contact 360** is the strongest screen in Vastora CRM — a unified view of everything known about a person across sales, communication, revenue, and AI insights. Pattern: Salesforce Contact record + HubSpot contact timeline + Linear clean layout.

**Route:** `/crm/contacts/:id`  
**Permission:** `crm:contact:read` (own/linked) or `crm:contact:read_all`

---

## 5.2 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CRM > Contacts > John Smith                                                 │
├──────────────────────────────────────────────────────────┬──────────────────┤
│ ┌──────────────────────────────────────────────────────┐│ RIGHT PANEL      │
│ │ [Avatar] John Smith                    [Active ▾]    ││                  │
│ │ Senior Manager · ABC Pvt Ltd                         ││ Upcoming Follow-up│
│ │ john@abc.com · +91 98765 43210 · [Call][Email][WA]  ││ Tomorrow 2 PM    │
│ │ [Log Activity ▾] [Edit] [⋮ More]                     ││                  │
│ └──────────────────────────────────────────────────────┘│ Open Deals (2)   │
│                                                          ││ ₹8.5L pipeline   │
│ [Overview][Timeline][Deals][Meetings][Tasks][Emails]    ││                  │
│ [WhatsApp][Invoices][Payments][Notes][Documents][AI]    ││ Lifetime Revenue │
│                                                          ││ ₹24,50,000       │
│ ┌──────────────────────────────────────────────────────┐│                  │
│ │                                                      ││ Customer Health  │
│ │              TAB CONTENT AREA                        ││ ████████░░ 82    │
│ │                                                      ││                  │
│ └──────────────────────────────────────────────────────┘│ Lead Score       │
│                                                          ││ 🔥 87 Hot        │
│                                                          ││                  │
│                                                          │ Recent Activity  │
│                                                          │ ● Call logged    │
│                                                          │ ● Email sent     │
│                                                          │                  │
│                                                          │ AI Suggestions   │
│                                                          │ → Send follow-up │
│                                                          │ → Schedule demo  │
└──────────────────────────────────────────────────────────┴──────────────────┘
```

---

## 5.3 Header Card Specification

| Element | Source | Behavior |
|---------|--------|----------|
| Avatar | `avatar_url` or initials | Click to upload `[P1]` |
| Full name | first + last name | Inline edit on click |
| Status badge | `status` | Dropdown to change (permission check) |
| Job title + company | title + primary company link | Company name links to Company 360 |
| Email | `email` | Click → mailto / compose modal |
| Phone | `phone` | Click → tel: link |
| Quick actions | Call, Email, WhatsApp | Opens communication center |
| Owner | `owner_id` | Display + reassign (manager) |

---

## 5.4 Tabs Specification

| Tab | Content | MVP | Data Source |
|-----|---------|-----|-------------|
| **Overview** | All fields, companies & roles, tags, custom fields, address | ✅ | contact + relations |
| **Timeline** | Unified chronological feed | ✅ | activities polymorphic |
| **Deals** | Linked deals table | ✅ `[Part 4]` | deals where contact_id |
| **Meetings** | Scheduled/past meetings | P1 | activities type=meeting |
| **Tasks** | Open/completed tasks | ✅ | tasks linked to contact |
| **Emails** | Email thread list | P1 | email integration |
| **WhatsApp** | Message history | P1 | WhatsApp integration |
| **Invoices** | Invoices where billing contact | ✅ `[Part 7]` | invoices |
| **Payments** | Payment history | ✅ `[Part 8]` | payments |
| **Notes** | Rich-text notes | ✅ | notes |
| **Documents** | File attachments | ✅ | documents |
| **AI Insights** | Score, suggestions, risk | P1 | AI module |

---

## 5.5 Overview Tab Fields

**Personal:** Name, email, phone, mobile, job title, department, LinkedIn, language, timezone  
**CRM:** Owner, source, status, lead score, health score, LTV, dates (created, last contacted)  
**Companies:** Table of linked companies with role badges  
**Tags & Segments:** Tag chips + segment membership  
**Custom Fields:** Dynamic grid `[P1]`  
**Compliance:** DNC flag with warning banner if `status = dnc`

---

## 5.6 Right Panel Widgets

### Upcoming Follow-up
Next scheduled task or meeting for this contact. Empty: "No follow-up scheduled — [Schedule]"

### Open Deals
Count + total pipeline value. Click → Deals tab filtered open.

### Lifetime Revenue
Sum of paid invoice amounts linked to contact/company. Updates on payment webhook.

### Customer Health Score `[P1]`
0–100 based on: payment timeliness, support tickets, engagement frequency, deal velocity.

### Lead Score
0–100; manual or AI. Badge: Hot (≥70), Warm (40–69), Cold (<40).

### Recent Activities
Last 5 items with "View all" → Timeline tab.

### AI Suggestions `[P1]`
- "Send follow-up email — no contact in 14 days"
- "Deal at risk — stage unchanged 21 days"
Max 3 suggestions; dismissible.

---

## 5.7 UI Flow — Open Contact 360

```
Click contact in list → GET /contacts/:id?include=companies,tags,stats
  → Render header + right panel stats
  → Default tab: Overview (or last visited tab — localStorage)
  → Lazy-load tab content on first visit
  → Skeleton loaders per tab
```

---

## 5.8 UI Flow — Change Status to DNC

```
Header status dropdown → Do Not Contact
  → Confirmation modal: "Outbound email/WhatsApp will be blocked"
  → Confirm → PATCH status=dnc
  → Red banner on profile
  → Audit: contact.status_changed
  → Timeline entry
```

---

## 5.9 API Contract — Get Contact 360

**GET** `/api/v1/crm/contacts/:id?include=companies,tags,stats,upcoming`

```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@abc.com",
  "phone": "+919876543210",
  "job_title": "Senior Manager",
  "status": "active",
  "owner": { "id": "uuid", "name": "Amit Sharma" },
  "companies": [
    {
      "company_id": "uuid",
      "name": "ABC Pvt Ltd",
      "role": "decision_maker",
      "is_primary": true
    }
  ],
  "tags": ["enterprise", "north-region"],
  "stats": {
    "open_deals_count": 2,
    "open_deals_value": 850000,
    "lifetime_revenue": 2450000,
    "lead_score": 87,
    "health_score": 82
  },
  "upcoming_follow_up": {
    "type": "task",
    "subject": "Follow-up call",
    "due_at": "2026-07-21T14:00:00Z"
  }
}
```

---

## 5.10 Tenant Scope

Contact detail returns 404 if `contact.tenant_id ≠ auth.tenant_id`.

---

## 5.11 Permissions

| Action | Permission |
|--------|------------|
| View 360 | `crm:contact:read` / `read_all` |
| Edit fields | `crm:contact:update` |
| Change status | `crm:contact:update` |
| View invoices | `crm:invoice:read_all` |
| View AI insights | `crm:contact:read` + AI enabled |
| Log activity | `crm:activity:create` |

---

## 5.12 Audit Log

All header edits, status changes, owner reassignments, tag changes logged with field diff.

---

## 5.13 Responsive

| Breakpoint | Layout |
|------------|--------|
| **Desktop** | Main 70% + right panel 30% sticky |
| **Tablet** | Right panel collapses below header as horizontal KPI cards |
| **Mobile** | Single column; tabs → horizontal scroll chip bar; right panel → accordion "Insights" above tabs |

Mobile sticky footer: Call | Email | Activity | More

---

## 5.14 Acceptance Criteria

- [ ] Contact 360 loads header + overview in < 600ms
- [ ] All 12 tabs defined with lazy loading
- [ ] Right panel KPIs match backend stats formulas
- [ ] Primary company link navigates to Company 360
- [ ] DNC status shows banner and blocks compose actions
- [ ] Tab state persists in URL: `/contacts/:id?tab=timeline`
- [ ] Mobile layout passes usability test (thumb reach, no horizontal scroll on content)
- [ ] Permission hides tabs user cannot access (e.g., Invoices)

---

**Next:** [06 — Company Profile 360](./06-company-profile-360.md)
