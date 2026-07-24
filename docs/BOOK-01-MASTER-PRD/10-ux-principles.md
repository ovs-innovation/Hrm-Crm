# Chapter 10 — UX Principles

**Book:** 1 — Master PRD  
**Chapter:** 10 of 13  
**Version:** 1.0.0-draft

---

## 10.1 Core UX Principles

### Principle 1 — Clarity Over Complexity

Every screen answers three questions instantly:

1. **Where am I?** (Breadcrumb, page title, active nav item)
2. **What can I do?** (Primary CTA visible, secondary actions in menus)
3. **What happened?** (Toast confirmations, status badges, activity timeline)

**Implementation:**
- Page titles are always `display-sm` (24px, semibold)
- Primary action button is top-right of list pages ("+ New Deal")
- Status changes show toast notification immediately

---

### Principle 2 — Progressive Disclosure

Show the minimum needed by default. Reveal complexity on demand.

| Level | What's Visible | Example |
|-------|----------------|---------|
| **Default** | Name, status, key metric, primary action | Deal list: name, stage, value, owner |
| **Expanded** | All fields, related records, history | Deal detail: all tabs |
| **Advanced** | Filters, bulk actions, export, settings | "Advanced Filters" toggle on list pages |

**Notion-inspired:** Clean list views. Full detail on click.

---

### Principle 3 — Consistent Layout Grammar

Every record detail page (Deal, Employee, Project, Ticket) follows the same structure:

```
┌─────────────────────────────────────────────┐
│ Breadcrumb: CRM > Deals > Acme Corp Deal    │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ Header Card                              │ │
│ │ [Avatar/Icon] Title    [Status Badge]    │ │
│ │ Owner: Priya  |  Value: ₹5L  |  Stage   │ │
│ │ [Edit] [Delete] [More Actions ▾]        │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ [Overview] [Activities] [Tasks] [Documents] │  ← Tabs
├─────────────────────────────────────────────┤
│                                             │
│ Tab Content Area                            │
│                                             │
├─────────────────────────────────────────────┤
│ Activity Timeline (collapsible sidebar)     │
│ ● Priya changed stage to Negotiation        │
│ ● Quote sent to client                      │
│ ● Deal created                              │
└─────────────────────────────────────────────┘
```

---

### Principle 4 — Immediate Feedback

| Action | Feedback | Timing |
|--------|----------|--------|
| Button click | Loading state on button (spinner + disabled) | Instant |
| Form submit | Optimistic UI update + toast on success | < 200ms perceived |
| Data fetch | Skeleton loader matching content shape | Show after 100ms delay |
| Delete | Confirmation modal → toast "Deleted" | Modal instant, action on confirm |
| Drag (Kanban) | Visual lift + drop zone highlight | 60fps |
| Error | Inline field error + toast for API errors | Instant |

**Never:** Blank white screen while loading. Always skeleton or spinner with context.

---

### Principle 5 — Forgiving Design

| Scenario | Behavior |
|----------|----------|
| Accidental delete | Soft delete + 90-day recovery + confirmation modal |
| Unsaved form changes | "You have unsaved changes" warning on navigate away |
| Failed API call | Retry button + error message explaining what failed |
| Empty required field | Inline validation on blur, not just on submit |
| Bulk action mistake | Confirmation with count: "Delete 5 selected deals?" |

---

### Principle 6 — Smart Defaults

Reduce configuration burden with intelligent defaults:

| Context | Default |
|---------|---------|
| New deal stage | First stage of default pipeline |
| New deal owner | Current user |
| Deal currency | Tenant default currency (INR) |
| New employee status | Active |
| Leave type | Annual (if balance available) |
| Project visibility | Team (not public) |
| Invoice due date | 30 days from creation |
| Task priority | Medium |
| Time zone | Tenant setting (Asia/Kolkata) |

Every default is overridable. None are hidden.

---

### Principle 7 — Keyboard-First Power Users

Linear-inspired keyboard shortcuts `[P1]`:

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + K` | Command palette (search anything) |
| `⌘/Ctrl + N` | New record (context-aware: new deal on CRM page) |
| `⌘/Ctrl + S` | Save current form |
| `Esc` | Close modal / cancel |
| `↑/↓` | Navigate list rows |
| `Enter` | Open selected record |
| `/` | Focus search/filter |

Shortcut hints shown in tooltips on hover `[P1]`.

---

### Principle 8 — Contextual AI

AI assistance appears **in context**, not in a separate app:

| Location | AI Feature |
|----------|------------|
| Deal detail → Email tab | "Draft follow-up email" button |
| Deal detail → Notes | "Summarize last 5 activities" |
| Lead list → Row action | "Analyze lead quality" |
| Meeting detail | "Generate meeting summary" |
| Recruitment → Applicant | "Parse resume" |
| Any page → `⌘K` | AI search: "Show deals closing this month" |

AI results appear inline, editable before saving.

---

## 10.2 Empty State Design

Every empty state follows this pattern:

```
┌─────────────────────────────────┐
│                                 │
│         [Illustration/Icon]     │
│                                 │
│     No deals yet                │  ← Clear statement
│     Create your first deal to   │  ← Helpful explanation
│     start tracking your pipeline│
│                                 │
│     [+ Create Deal]             │  ← Primary CTA
│                                 │
└─────────────────────────────────┘
```

Rules:
- Never show empty table headers with no rows — show empty state instead
- CTA matches the primary action for that page
- For filtered empty results: "No results match your filters. [Clear filters]"

---

## 10.3 Error State Design

| Error Type | UI Treatment |
|------------|-------------|
| Field validation | Red border + message below field |
| Form submission | Toast (error) + scroll to first error |
| API error (4xx) | Toast with specific message |
| API error (5xx) | Full-page error state with retry button |
| Network offline | Banner: "You're offline. Changes will sync when reconnected." |
| Permission denied | Inline message: "You don't have permission to view this." |
| Not found (404) | Page: "This record doesn't exist or was deleted." |

Error messages must be **human-readable**, never raw API error codes.

---

## 10.4 Loading State Design

| Context | Loading Pattern |
|---------|-----------------|
| Page load | Skeleton matching page layout (cards, table rows) |
| Table data | Skeleton rows (5 rows default) |
| Button action | Spinner inside button, button disabled |
| Background refresh | Subtle progress bar at top of content area |
| File upload | Progress bar with percentage |
| Long operation (> 3s) | Progress indicator + "Processing..." message |

---

## 10.5 Notification Strategy

| Channel | Usage | Priority |
|---------|-------|----------|
| **In-app toast** | Action confirmations (saved, deleted, sent) | Immediate |
| **In-app bell** | Assignments, approvals needed, mentions | Persistent until read |
| **Email** | Daily digest, leave approval requests, invoice sent | Async |
| **Push (mobile)** | Urgent approvals, SLA breaches `[P1]` | Urgent only |

### Notification Rules

- Toasts auto-dismiss (3s success, 5s error)
- Bell badge shows unread count
- Email notifications respect user preferences (Settings → Notifications)
- Never notify for user's own actions
- Batch non-urgent notifications into daily digest

---

## 10.6 Search & Filter UX

### Global Search (`⌘K`) `[P1]`

- Searches across all modules: deals, contacts, employees, projects, tasks
- Results grouped by module with icon
- Recent searches remembered
- AI-powered: natural language queries `[P2]`

### List Page Filters

- Inline filter bar below page title
- Common filters visible; "More filters" expands advanced options
- Active filters shown as removable chips
- Filter state preserved in URL query params (shareable, back-button safe)
- Saved filter views `[P1]`: "My Open Deals", "Overdue Invoices"

---

## 10.7 Form UX Standards

| Rule | Specification |
|------|---------------|
| Label position | Above input (never placeholder-only labels) |
| Required fields | Asterisk (*) on label + "Required" in validation message |
| Field width | Full width on mobile; appropriate width on desktop (not all full-width) |
| Section grouping | Related fields in `<fieldset>` with section heading |
| Save behavior | Sticky footer with Save + Cancel on long forms |
| Auto-save | Draft auto-save for long forms (every 30s) `[P1]` |
| Validation timing | On blur for individual fields; on submit for full form |

---

## 10.8 Mobile UX Adaptations `[P1]`

| Desktop Pattern | Mobile Adaptation |
|-----------------|-------------------|
| Sidebar navigation | Bottom tab bar (4 items) + hamburger for rest |
| Data tables | Card list view (stacked fields) |
| Multi-column forms | Single column, full width |
| Modal | Full-screen slide-up sheet |
| Dashboard grid | Single column, swipeable metric cards |
| Kanban board | Horizontal scroll columns |

Priority mobile flows: Leave apply, Attendance clock-in, Approval actions, Notifications.

---

## 10.9 Onboarding UX

### First-Time User (New Tenant)

```
Step 1: Company Profile (name, industry, size) — 30 seconds
Step 2: Invite Team (email list, role assignment) — 1 minute
Step 3: Choose Modules (pre-selected based on industry) — 15 seconds
Step 4: Import Data (optional CSV upload or skip) — 2 minutes
Step 5: Guided Tour (interactive highlights on dashboard) — 1 minute
Step 6: First Action Prompt ("Create your first lead" or "Add an employee")
```

Total target: < 5 minutes to dashboard with guided first action.

### Returning User

- Skip onboarding, land on role-appropriate dashboard
- "What's new" changelog modal on version updates `[P1]`

---

**Previous:** [09 — Design Philosophy & Tokens](./09-design-philosophy-tokens.md)  
**Next:** [11 — Information Architecture & Navigation](./11-information-architecture.md)
