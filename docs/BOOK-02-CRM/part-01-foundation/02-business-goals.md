# Chapter 2 — Business Goals & Success Metrics

**Book:** 2 — CRM PRD · **Part:** 1 — Foundation · **Chapter:** 2  
**Version:** 1.0.0-draft

---

## 2.1 Strategic Goals

| # | Goal | Measurement |
|---|------|-------------|
| G1 | Reduce lead response time | Avg time from lead creation to first activity < 4 hours |
| G2 | Increase pipeline visibility | 100% of active deals in CRM (not spreadsheets) |
| G3 | Accelerate quote-to-close | Quote sent within 24h of deal entering Proposal stage |
| G4 | Eliminate invoice leakage | 100% of won deals have invoice within 7 days |
| G5 | Improve forecast accuracy | Forecast vs actual revenue within 15% variance |
| G6 | Enable demo-driven sales | Full CRM demo completable in < 10 minutes |

---

## 2.2 User Goals by Role

### Sales Representative

- See my leads and deals in one place
- Log calls/emails in < 30 seconds
- Generate quote from deal without leaving CRM
- Know exactly what follow-up is due today

### Sales Manager

- View team pipeline and individual performance
- Reassign leads/deals when reps leave or underperform
- Approve quotes above threshold
- Forecast monthly/quarterly revenue

### Tenant Admin / CEO

- Dashboard: pipeline value, win rate, revenue MTD
- Ensure no deal falls through cracks
- Track sales team ROI

---

## 2.3 Key Performance Indicators (CRM Module)

### Product KPIs (Platform-Level)

| KPI | Definition | Target (6 mo post-launch) |
|-----|------------|---------------------------|
| CRM module adoption | % of Growth tenants with ≥1 deal created | > 80% |
| Lead conversion rate | Leads converted / total leads | Track baseline; improve 10% YoY |
| Deal win rate | Won deals / (won + lost) | Customer-specific baseline |
| Quote acceptance rate | Accepted quotes / sent quotes | > 40% |
| Invoice collection rate | Paid invoices / sent invoices | > 85% within due date |
| Time to first deal | Signup → first deal created | < 24 hours (guided onboarding) |
| Daily active CRM users | Users with CRM activity / total CRM users | > 60% |

### UX KPIs

| KPI | Target |
|-----|--------|
| Lead create flow completion | > 95% (start form → save) |
| Deal stage drag success rate | > 99% (no failed drops) |
| Quote PDF download success | > 99.5% |
| Mobile lead view usability | Task completion without horizontal scroll |

---

## 2.4 User Stories (Epic Level)

### Epic 1 — Lead Management
> As a **sales rep**, I want to capture and qualify leads so that no prospect is lost.

### Epic 2 — Pipeline Management
> As a **sales manager**, I want a visual pipeline so that I can forecast revenue and coach my team.

### Epic 3 — Quote-to-Cash
> As a **sales rep**, I want to send a professional quote and convert it to an invoice so that I close deals faster.

### Epic 4 — Payment Collection
> As a **finance user**, I want to track invoice payments so that I know what's outstanding.

### Epic 5 — Sales Intelligence
> As a **CEO**, I want a sales dashboard so that I understand business health at a glance.

### Epic 6 — AI Assistance `[P1]`
> As a **sales rep**, I want AI to suggest my next action so that I never miss a follow-up.

---

## 2.5 Success Criteria for MVP Launch

CRM MVP is complete when a tenant can execute this script **without workarounds**:

```
1. Import 50 leads from CSV
2. Assign leads to 3 sales reps via round-robin rule
3. Rep qualifies lead → converts to Contact + Company + Deal
4. Manager moves deal through 5 pipeline stages on Kanban
5. Rep creates quotation with 3 line items + 18% GST
6. Manager approves quote (if > ₹1L threshold)
7. Send quote PDF to client (email)
8. Mark deal as Won → auto-create project draft
9. Generate invoice from quote
10. Record offline payment → invoice marked Paid
11. View sales dashboard: pipeline value, won revenue MTD
12. Export pipeline report to CSV
```

**All 12 steps must pass QA with zero P0/P1 bugs.**

---

## 2.6 Out of Scope for CRM MVP

| Feature | Deferred To | Reason |
|---------|-------------|--------|
| Marketing email campaigns | P2 | Focus on sales workflow first |
| LinkedIn lead import | P2 | API dependency |
| CPQ (complex configure-price-quote) | P2 | Enterprise feature |
| Multi-currency deals | P1 | INR-first launch |
| Contract management | P2 | Legal workflow complexity |
| E-signature on quotes | P1 | Integration (DocuSign) |
| Territory management | P2 | Enterprise sales teams |
| Partner/reseller portal | P2 | Channel sales |

---

## 2.7 Assumptions & Dependencies

| Assumption | Risk if Wrong |
|------------|---------------|
| Target customers sell B2B with 1–90 day sales cycles | Pipeline stages may need adjustment for B2C |
| INR is primary currency | Multi-currency needed earlier |
| GST 18% default tax rate | Need configurable tax slabs (handled in Part 6/7) |
| Razorpay available for Indian payments | Need Stripe fallback for international |
| Tenants have < 10,000 CRM records in Year 1 | Pagination/search architecture sufficient |
| Book 1 RBAC model is implemented before CRM launch | CRM permissions blocked |

---

**Previous:** [01 — CRM Overview](./01-crm-overview.md)  
**Next:** [03 — CRM User Roles](./03-crm-user-roles.md)
