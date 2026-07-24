# Chapter 7 — SaaS Business Model

**Book:** 1 — Master PRD  
**Chapter:** 7 of 13  
**Version:** 1.0.0-draft

---

## 7.1 Business Model Overview

Vastora CRM is a **multi-tenant B2B SaaS** product sold on subscription:

- **Revenue model:** Monthly/annual recurring subscription per tenant
- **Pricing unit:** Per user seat + module tier
- **Distribution:** Self-serve signup + inside sales for Enterprise
- **Free trial:** 14 days, full Growth tier access, no credit card required

---

## 7.2 Subscription Tiers

### Tier 1 — Starter

| Attribute | Value |
|-----------|-------|
| **Target** | Small teams (10–25 employees), HR-first |
| **Price** | ₹999/user/month (annual: ₹799/user/month) |
| **Modules** | HRM, Messenger, Basic Dashboard |
| **Users** | Min 5, max 50 |
| **Storage** | 5 GB |
| **Support** | Email, 48h response |
| **AI** | Not included |

### Tier 2 — Growth

| Attribute | Value |
|-----------|-------|
| **Target** | Growing businesses (25–200 employees) |
| **Price** | ₹1,499/user/month (annual: ₹1,199/user/month) |
| **Modules** | HRM + CRM + Projects |
| **Users** | Min 10, max 200 |
| **Storage** | 25 GB |
| **Support** | Email + Chat, 24h response |
| **AI** | Add-on: ₹299/user/month |

### Tier 3 — Enterprise

| Attribute | Value |
|-----------|-------|
| **Target** | Mid-market (200–1,000 employees) |
| **Price** | Custom (starts ~₹1,999/user/month) |
| **Modules** | All modules + Finance + Support |
| **Users** | Unlimited |
| **Storage** | 100 GB+ (custom) |
| **Support** | Dedicated CSM, 4h response, phone |
| **AI** | Included |
| **Extras** | SSO, IP restriction, custom roles, SLA, data export API |

---

## 7.3 Add-Ons

| Add-On | Price | Description |
|--------|-------|-------------|
| AI Suite | ₹299/user/mo | All AI features across modules |
| Extra Storage | ₹500/25GB/mo | Additional document storage |
| Client Portal | ₹199/portal user/mo | External client access seats |
| WhatsApp Integration | ₹999/mo flat | Business API messaging |
| Priority Support | ₹5,000/mo flat | 4h response SLA |
| Custom Domain | ₹999/mo | `crm.yourcompany.com` white-label login |
| Implementation Services | One-time | Data migration, training (partner-led) |

---

## 7.4 Trial & Conversion Flow

```
Landing Page → Sign Up (email + company name)
    → 14-day Growth trial (auto-provisioned tenant)
    → Onboarding wizard (industry, team size, module selection)
    → Day 3: Email — "Have you created your first lead?"
    → Day 7: Email — Feature highlight + case study
    → Day 12: Email — "Trial ending in 2 days"
    → Day 14: Grace period (read-only, 3 days)
    → Day 17: Account suspended (data retained 30 days)
    → Convert: Select tier → Payment → Full access restored
```

### Trial Limitations

- Max 10 users during trial
- "Powered by Vastora" badge on exported documents
- No API access during trial
- AI features: 50 requests total during trial

---

## 7.5 Billing & Payments

| Attribute | Specification |
|-----------|---------------|
| **Billing cycle** | Monthly or annual (20% annual discount) |
| **Payment methods** | Credit/debit card, UPI, net banking (India); Stripe `[International P2]` |
| **Currency** | INR primary; USD `[P2]` |
| **Invoicing** | Auto-generated GST invoice for Indian customers |
| **Failed payment** | Retry 3× over 7 days → suspend → cancel after 30 days |
| **Upgrade/downgrade** | Prorated immediately; downgrade at next cycle |
| **Refunds** | Pro-rata within 14 days of initial purchase only |

---

## 7.6 Coupons & Promotions

| Type | Example | Rules |
|------|---------|-------|
| Percentage off | `LAUNCH20` — 20% off first year | One per tenant, admin-configurable |
| Extended trial | `TRIAL30` — 30 days instead of 14 | New signups only |
| Module unlock | `FREECRM` — CRM free for 3 months | Specific module, time-limited |
| Partner referral | Partner code → 15% recurring commission | Tracked via referral ID |

Coupon fields: code, discount_type (%), discount_value, valid_from, valid_until, max_uses, applicable_tiers[], applicable_modules[].

---

## 7.7 Usage Limits & Enforcement

| Resource | Starter | Growth | Enterprise |
|----------|---------|--------|------------|
| Users | 50 | 200 | Unlimited |
| Storage | 5 GB | 25 GB | 100 GB+ |
| API calls/day | — | 10,000 | 100,000 |
| AI requests/mo | — | 500 (add-on) | Unlimited |
| Custom fields/entity | 10 | 50 | Unlimited |
| Pipelines | — | 3 | Unlimited |
| Audit log retention | 30 days | 90 days | 1 year |

**Enforcement:** Soft limit warnings at 80% → hard block at 100% → upsell prompt.

---

## 7.8 Multi-Tenant Architecture (Business View)

Each **Tenant** = one customer company.

| Concept | Description |
|---------|-------------|
| **Tenant** | Isolated company account with own data, users, settings |
| **Tenant Admin** | Owner who manages billing, users, modules |
| **Subdomain** | `{company}.vastora.com` or custom domain |
| **Data isolation** | Row-level tenant_id on every table; no cross-tenant queries |
| **Tenant provisioning** | Auto on signup; tenant created in < 5 seconds |

---

## 7.9 Revenue Projections (Year 1 — Conservative)

| Quarter | Tenants | Avg Users/Tenant | Avg ARPU | MRR |
|---------|---------|-------------------|----------|-----|
| Q1 | 5 | 15 | ₹1,200 | ₹90,000 |
| Q2 | 15 | 20 | ₹1,300 | ₹3,90,000 |
| Q3 | 30 | 25 | ₹1,400 | ₹10,50,000 |
| Q4 | 50 | 30 | ₹1,500 | ₹22,50,000 |

**Year 1 ARR target:** ~₹2.7 Cr (~$325K)

---

## 7.10 Customer Success & Retention

| Stage | Actions |
|-------|---------|
| **Onboarding (Week 1)** | Guided setup, first record created, team invited |
| **Adoption (Month 1)** | Module usage tracking, nudge emails for unused features |
| **Value (Month 3)** | QBR for Enterprise; usage report for Growth |
| **Renewal (Month 11)** | Renewal reminder, annual upgrade offer |
| **Expansion** | Upsell modules, add users, AI add-on |

### Churn Prevention Triggers

- No login for 14 days → re-engagement email
- Module usage < 20% → feature training offer
- Support tickets > 5/month → CSM outreach
- Failed payment → immediate notification + grace period

---

## 7.11 Partner & Channel Strategy `[P2]`

| Channel | Model |
|---------|-------|
| Implementation partners | 15% recurring commission |
| Accounting firms | Refer HR + Finance module clients |
| IT consultants | White-label reselling `[Future]` |
| Marketplace listings | Zoho Marketplace alternative, G2, Capterra |

---

## 7.12 Legal & Compliance

| Requirement | Status |
|-------------|--------|
| Terms of Service | `[Required before launch]` |
| Privacy Policy | `[Required before launch]` |
| GDPR data processing | `[P2]` |
| SOC 2 Type II | `[P2]` |
| India DPDP Act compliance | `[P1]` |
| GST on SaaS (18%) | Built into billing |

---

**Previous:** [06 — Product Modules](./06-product-modules.md)  
**Next:** [08 — User Roles & Permissions](./08-user-roles-permissions.md)
