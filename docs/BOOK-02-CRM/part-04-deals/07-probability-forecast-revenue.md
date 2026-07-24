# Chapter 7 — Probability, Forecast & Revenue

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 7  
**Version:** 1.0.0-draft

---

## 7.1 Weighted Pipeline Formula

```
Weighted Amount = Deal Amount × (Deal Probability OR Stage Probability) / 100
```

Default: use stage probability unless deal-level override set `[P1]`.

---

## 7.2 Forecast Views

| View | Description |
|------|-------------|
| **Pipeline value** | Sum of open deal amounts |
| **Weighted forecast** | Sum of weighted amounts |
| **Best case** | 100% of open pipeline |
| **Commit** | Deals in Negotiation+ stages only `[P1]` |
| **Won MTD** | Sum won deals closed this month |

Displayed on: Board footer, CRM Dashboard (Part 1), Forecast report (Part 9).

---

## 7.3 Forecast Chart `[P1]`

```
Bar chart: Expected close by month
  Stacked by stage OR owner
  Toggle weighted vs raw
```

Zoho-inspired funnel chart available in Reports (Part 9) — Vastora uses brand blue gradient bars.

---

## 7.4 UI — Forecast Widget (Board Footer)

```
18 open · ₹42.5L pipeline · ₹18.2L weighted · ₹8.2L won MTD
```

Click → `/crm/reports/forecast`

---

## 7.5 API

**GET** `/api/v1/crm/deals/forecast?pipeline_id=&period=quarter`

```json
{
  "pipeline_value": 4250000,
  "weighted_forecast": 1820000,
  "won_mtd": 820000,
  "by_month": [
    { "month": "2026-07", "amount": 1200000, "weighted": 480000, "deal_count": 5 }
  ],
  "by_stage": [
    { "stage_id": "uuid", "name": "Proposal", "amount": 1500000, "weighted": 600000 }
  ]
}
```

---

## 7.6 Tenant Scope

Forecast aggregates tenant-scoped deals only; respects read_all vs own.

---

## 7.7 Acceptance Criteria

- [ ] Weighted amounts match formula on board and dashboard
- [ ] Forecast API returns by_month breakdown
- [ ] Currency formatted ₹ with L/Cr notation in UI

---

**Next:** [08 — Win & Loss Workflows](./08-win-loss-workflows.md)
