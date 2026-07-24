# Chapter 6 — Deal Detail 360

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 6  
**Version:** 1.0.0-draft

---

## 6.1 Purpose

Deal 360 combines Zoho-style **stage path stepper** + **related records** + Vastora **right insight panel**.

**Route:** `/crm/deals/:id`

---

## 6.2 Desktop Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CRM > Deals > Acme Enterprise License                                       │
├──────────────────────────────────────────────────────────┬──────────────────┤
│ ┌────────────────────────────────────────────────────────┐│ INSIGHTS         │
│ │ Acme Enterprise License              [Open ▾]          ││                  │
│ │ ABC Pvt Ltd · John Smith                             ││ Amount           │
│ │ ₹8,50,000 · Close Aug 15, 2026                       ││ ₹8,50,000        │
│ │ Owner: Amit · Pipeline: Enterprise                   ││                  │
│ │ [Mark Won] [Mark Lost] [+ Quote] [Log Activity] [Edit]││ Weighted (40%)   │
│ └────────────────────────────────────────────────────────┘│ ₹3,40,000        │
│                                                          ││                  │
│ STAGE PATH (Zoho-inspired stepper):                     ││ Days in stage: 5 │
│ ● Qualification ── ● Needs Analysis ── ◉ Proposal ── ○ Negotiation ── ○ Won│
│                                                          ││                  │
│ [Overview][Timeline][Contact][Quotes][Invoices][Tasks][Docs][AI]           │
│ ┌────────────────────────────────────────────────────────┐│ Next step        │
│ │ Tab content                                            ││ Follow-up call   │
│ └────────────────────────────────────────────────────────┘│ Jul 22           │
└──────────────────────────────────────────────────────────┴──────────────────┘
```

---

## 6.3 Stage Path Stepper (Key UX)

| State | Visual |
|-------|--------|
| Completed stage | Filled circle brand + check |
| Current stage | Ring `ring-4 ring-brand/20` + filled |
| Future stage | Empty circle `border-line` |
| Won/Lost terminal | Green/red filled |

Click future stage → confirmation if gates pass → moves deal.

**Mobile:** Horizontal scroll stepper; current stage centered.

---

## 6.4 Header Actions

| Button | Action | Permission |
|--------|--------|------------|
| Mark Won | Win workflow (Ch. 8) | update |
| Mark Lost | Loss workflow | update |
| + Quote | `/crm/quotes/new?deal=:id` | quote:create |
| Log Activity | Activity modal | activity:create |
| Edit | Edit drawer | update |

---

## 6.5 Tabs

| Tab | Content |
|-----|---------|
| Overview | All deal fields, description, custom fields |
| Timeline | Unified activity feed |
| Contact | Primary + additional contacts `[P1]` |
| Quotes | Quotation list linked to deal |
| Invoices | Invoice list |
| Tasks | CRM tasks |
| Documents | Attachments |
| AI | Risk score, next action `[P1]` |

---

## 6.6 Right Panel — Insights

| Widget | Source |
|--------|--------|
| Amount | deal.amount |
| Weighted | computed |
| Days in stage | now - last stage change |
| Next step | deal.next_step + date |
| Quote status | latest quote status chip |
| Competitor `[P1]` | custom field |

---

## 6.7 API

**GET** `/api/v1/crm/deals/:id?include=company,contact,stage,timeline_preview,quotes`

---

## 6.8 Tenant Scope / Permissions / Audit

Standard Part 4 rules. Stage click changes audit `deal.stage_changed`.

---

## 6.9 Responsive

| Breakpoint | Layout |
|------------|--------|
| Desktop | 2-column with sticky insights panel |
| Tablet | Insights as horizontal KPI strip |
| Mobile | Full width; stage stepper scroll; actions in bottom sheet FAB |

---

## 6.10 Acceptance Criteria

- [ ] Stage stepper reflects current stage; clickable navigation works
- [ ] Mark Won/Lost opens workflow modals
- [ ] Company and contact link to 360 profiles
- [ ] Tab lazy loading
- [ ] Mobile FAB for primary actions

---

**Next:** [07 — Probability, Forecast & Revenue](./07-probability-forecast-revenue.md)
