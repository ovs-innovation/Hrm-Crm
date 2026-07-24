# Chapter 6 — CRM Dashboard

**Book:** 2 — CRM PRD · **Part:** 1 — Foundation · **Chapter:** 6  
**Version:** 1.0.0-draft

---

## 6.1 Purpose

The CRM Dashboard (`/crm`) is the **command center** for sales leadership and admins. It answers: *How is sales performing right now? What needs attention today?*

Sales reps land on Pipeline Board by default; managers and admins land here.

---

## 6.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| CRM-D01 | As a sales manager, I want to see total pipeline value so I can forecast revenue | MVP |
| CRM-D02 | As a sales manager, I want to see deals closing this month so I can coach reps | MVP |
| CRM-D03 | As a sales manager, I want to see overdue follow-ups so nothing falls through | MVP |
| CRM-D04 | As a CEO, I want win rate and revenue MTD on one screen | MVP |
| CRM-D05 | As a sales manager, I want team leaderboard by won revenue | P1 |
| CRM-D06 | As a sales rep, I want my personal quota progress `[P1]` | P1 |

---

## 6.3 Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ CRM Dashboard                    [Date Range ▾] [Export]        │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Pipeline     │ Won Revenue  │ Win Rate     │ Avg Deal Size     │
│ ₹42.5L       │ ₹8.2L MTD    │ 32%          │ ₹1.8L             │
│ ↑ 12% vs LM  │ ↑ 8% vs LM   │ ↓ 2pp        │ → flat            │
├──────────────┴──────────────┴──────────────┴───────────────────┤
│ ┌─────────────────────────────┐ ┌───────────────────────────┐ │
│ │ Pipeline by Stage (bar)     │ │ Revenue Trend (line, 6mo) │ │
│ └─────────────────────────────┘ └───────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌───────────────────────────┐ │
│ │ Deals Closing This Month    │ │ Overdue Activities (5)    │ │
│ │ [table: deal, value, rep]   │ │ [list with quick action]  │ │
│ └─────────────────────────────┘ └───────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Recent Activity Feed                                            │
│ ● Priya moved Acme deal to Negotiation — 2h ago                 │
│ ● Quote QT-0042 sent to TechCorp — 4h ago                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6.4 Widget Specifications

### Widget 1 — Pipeline Value (KPI Card)

| Attribute | Spec |
|-----------|------|
| **Metric** | Sum of `deal.amount` where `stage.is_closed = false` |
| **Subtitle** | % change vs previous period |
| **Period filter** | Applies to comparison only |
| **Click action** | Navigate to `/crm/deals/board` |
| **Permission** | `crm:deal:read_all` or aggregated own |

### Widget 2 — Won Revenue MTD (KPI Card)

| Attribute | Spec |
|-----------|------|
| **Metric** | Sum of won deal amounts where `closed_at` in current month |
| **Alternative** | Sum of paid invoice amounts MTD (toggle `[P1]`) |
| **Currency** | Tenant default (INR) |

### Widget 3 — Win Rate (KPI Card)

| Attribute | Spec |
|-----------|------|
| **Formula** | `won_deals / (won_deals + lost_deals) × 100` |
| **Period** | Last 90 days rolling (configurable) |
| **Empty state** | "Not enough closed deals yet" |

### Widget 4 — Average Deal Size (KPI Card)

| Attribute | Spec |
|-----------|------|
| **Formula** | `total_won_value / count_won_deals` |
| **Period** | Last 90 days |

### Widget 5 — Pipeline by Stage (Bar Chart)

| Attribute | Spec |
|-----------|------|
| **X-axis** | Pipeline stages (ordered) |
| **Y-axis** | Deal count or total value (toggle) |
| **Colors** | Brand blue gradient per stage |
| **Interaction** | Click stage → filter pipeline board |

### Widget 6 — Revenue Trend (Line Chart)

| Attribute | Spec |
|-----------|------|
| **X-axis** | Last 6 months |
| **Y-axis** | Won revenue per month |
| **Library** | Recharts or Chart.js |
| **Empty** | Flat line at 0 with CTA "Close your first deal" |

### Widget 7 — Deals Closing This Month (Table)

| Column | Source |
|--------|--------|
| Deal Name | `deal.title` |
| Company | `company.name` |
| Value | `deal.amount` |
| Owner | User name |
| Expected Close | `deal.expected_close_date` |
| Stage | Stage name badge |
| Days Left | Calculated |

Max 10 rows; "View all" → `/crm/deals?close_date=this_month`

### Widget 8 — Overdue Activities (List)

| Attribute | Spec |
|-----------|------|
| **Query** | Activities where `due_at < now()` and `status != completed` |
| **Scope** | Team (manager) or own (rep if dashboard accessible) |
| **Action** | "Mark done" inline button |
| **Empty** | "All caught up!" with green check |

### Widget 9 — Recent Activity Feed

- Last 20 CRM activities across tenant (manager) or own (rep)
- Polymorphic: deal stage changes, quotes sent, leads converted, payments recorded
- Real-time update via Socket.IO `[P1]`; poll 60s MVP

---

## 6.5 Filters & Controls

| Control | Options | Default |
|---------|---------|---------|
| Date range | This month, Last month, This quarter, Custom | This month |
| Pipeline | All pipelines, specific pipeline | Default pipeline |
| Team / Owner | All, specific rep `[P1]` | All |
| Export | PDF dashboard snapshot `[P1]`, CSV metrics | — |

---

## 6.6 API Endpoints (Dashboard)

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/crm/dashboard/summary?period=&pipeline_id=` | KPI metrics object |
| GET | `/api/crm/dashboard/pipeline-chart?pipeline_id=` | Stage breakdown array |
| GET | `/api/crm/dashboard/revenue-trend?months=6` | Monthly revenue array |
| GET | `/api/crm/dashboard/closing-soon?limit=10` | Deal array |
| GET | `/api/crm/dashboard/overdue-activities?limit=5` | Activity array |
| GET | `/api/crm/dashboard/activity-feed?limit=20` | Activity feed array |

### Sample Response — `/api/crm/dashboard/summary`

```json
{
  "pipeline_value": 4250000,
  "pipeline_change_pct": 12.4,
  "won_revenue_mtd": 820000,
  "won_revenue_change_pct": 8.1,
  "win_rate_pct": 32,
  "win_rate_change_pp": -2,
  "avg_deal_size": 180000,
  "currency": "INR"
}
```

---

## 6.7 Empty State (New Tenant)

No CRM data yet:

```
┌─────────────────────────────────────────┐
│         [Illustration: pipeline]        │
│     Welcome to Vastora CRM              │
│     Import leads or create your first   │
│     deal to see your dashboard.         │
│     [Import Leads]  [Create Deal]       │
└─────────────────────────────────────────┘
```

Onboarding checklist widget `[P1]`:
- [ ] Create first lead
- [ ] Set up pipeline stages
- [ ] Add a product to catalog
- [ ] Create first deal
- [ ] Send first quote

---

## 6.8 Acceptance Criteria

- [ ] Dashboard loads in < 2 seconds with 500 deals in tenant
- [ ] KPI cards show correct values per formulas above
- [ ] Date range filter updates all widgets consistently
- [ ] sales_rep without dashboard permission redirected to `/crm/deals/board`
- [ ] Mobile: KPI cards stack 2×2, charts full width below
- [ ] All monetary values use IBM Plex Sans `[P1]` with ₹ formatting

---

**Previous:** [05 — CRM Navigation](./05-crm-navigation.md)  
**Next Part:** [Part 2 — Lead Management](../part-02-leads/README.md)
