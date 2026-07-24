# Chapter 9 — Deal → Project Automation

**Book:** 2 — CRM PRD · **Part:** 4 — Deals · **Chapter:** 9  
**Version:** 1.0.0-draft

---

## 9.1 Trigger

On **Deal Won** when `create_project = true`:

```
Project created:
  name: deal.title
  company_id: deal.company_id
  deal_id: deal.id
  owner_id: deal.owner_id OR project_manager default
  status: planning
  budget: deal.final_amount
```

---

## 9.2 UI

Toast: "Deal won! Project **Acme Enterprise** created." [View Project]

Deal 360 Overview shows linked project card.

---

## 9.3 Automation Rule `[P1]`

Settings → Automation → "On deal won, create project" toggle per pipeline.

---

## 9.4 API Side Effect

Win endpoint returns:

```json
{
  "deal_id": "uuid",
  "project_id": "uuid",
  "invoice_draft_id": "uuid"
}
```

---

## 9.5 Acceptance Criteria

- [ ] Project linked to deal and company
- [ ] Idempotent: second win call returns 409
- [ ] Project visible in Book 4 module

---

**Next:** [10 — Technical Spec & Acceptance](./10-deal-technical-spec.md)
