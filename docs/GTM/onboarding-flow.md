# Onboarding Flow — Vastora CRM

**Version:** 1.0.0-draft  
**Target time to first value:** < 15 minutes

---

## Flow Diagram

```
Sign Up → Email Verify → Company Setup → Role Selection
    → Module Selection → Invite Team (optional)
    → Import Data (optional) → Guided Tour → First Action
    → Role Dashboard
```

---

## Step-by-Step

### Step 1 — Sign Up (30 sec)
- Email, password, company name
- Auto-create tenant + tenant_admin user
- 14-day Growth trial provisioned

### Step 2 — Email Verification (1 min)
- Verification link; can skip to wizard with banner reminder

### Step 3 — Company Setup (1 min)
- Industry (dropdown: IT, Agency, Healthcare, Real Estate, Manufacturing, Other)
- Company size (10–25, 26–50, 51–100, 101–500, 500+)
- Country (default India)

### Step 4 — Primary Goal (15 sec)
- "What do you want to set up first?"
  - Manage employees (HR) → HR-focused tour
  - Track sales pipeline (CRM) → CRM-focused tour
  - Both → Full tour

### Step 5 — Invite Team (2 min, skippable)
- Add emails + roles (sales_rep, hr_manager, employee)
- Sends invite emails

### Step 6 — Import Data (3 min, skippable)
- Options: Import leads CSV, Import employees CSV, Skip

### Step 7 — Guided Tour (2 min)
- Interactive tooltips on dashboard highlighting key nav items
- CRM path: "Create your first lead" spotlight
- HR path: "Add your first employee" spotlight

### Step 8 — First Action Checkpoint
- Modal: "You're ready! Create your first lead?"
- CTA opens lead create form pre-filled with sample if skipped

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Wizard completion rate | > 70% |
| Time to first record | < 15 min |
| Team invite rate | > 40% of tenants invite ≥1 user |
| Day 7 retention | > 50% |

---

## CRM-Specific Onboarding Checklist (In-App Widget)

- [ ] Set up pipeline stages
- [ ] Add products to catalog
- [ ] Create first lead
- [ ] Convert lead to deal
- [ ] Send first quotation
- [ ] Invite sales team member

Dismissible after all complete or after 30 days.
