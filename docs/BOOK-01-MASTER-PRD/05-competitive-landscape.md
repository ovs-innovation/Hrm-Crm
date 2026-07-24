# Chapter 5 — Competitive Landscape

**Book:** 1 — Master PRD  
**Chapter:** 5 of 13  
**Version:** 1.0.0-draft

---

## 5.1 Market Context

The SMB business software market is dominated by **point solutions** (CRM-only, HR-only) and **legacy suites** (Zoho One, ERPNext) that unify modules but suffer from dated UX or open-source complexity.

Vastora enters as a **modern unified platform** — full module breadth with Linear/Stripe-level UX and native AI.

---

## 5.2 Competitive Matrix

| Competitor | Category | Strengths | Weaknesses | Vastora Advantage |
|------------|----------|-----------|------------|-------------------|
| **Zoho One** | Unified suite | 45+ apps, India pricing, brand trust | Dated UX, app-switching friction, inconsistent design | Single unified UX, modern design, AI-native |
| **HubSpot** | CRM + Marketing | Best-in-class CRM workflows, ecosystem | Expensive at scale, weak HRM/Projects | Unified HRM + Projects + Finance at SMB price |
| **Salesforce** | Enterprise CRM | Market leader, AppExchange | Overkill + cost for SMB, no native HRM | Built for 10–1000 employees, all-in-one |
| **Keka / Darwinbox** | HRMS | Strong India payroll compliance | No CRM, no projects | Full business ops, not just HR |
| **Freshworks** | CRM + Support | Good support desk, affordable | Modules feel separate, not one data model | True unified data model |
| **ERPNext** | Open-source ERP | Free, full ERP modules | Self-host complexity, dated UI, steep learning curve | SaaS simplicity, premium UX |
| **Monday.com** | Work OS | Flexible boards, visual | Not true CRM/HRM/Finance, gets expensive | Purpose-built business modules |
| **Linear** | Project/Issues | Best-in-class dev UX | Dev-only, no CRM/HR | Linear-inspired project UX + full BOS |
| **Notion** | Docs/Wiki | Flexible, beloved UX | Not structured for CRM/payroll/compliance | Structured business data + Notion-like clarity |

---

## 5.3 Positioning Map

```
                    High UX Quality
                          │
              Linear      │      ★ Vastora (target)
                          │
    Point Solutions ──────┼────── Unified Suites
    (HubSpot, Keka)       │      (Zoho, ERPNext)
                          │
                    Low UX Quality
```

**Vastora target quadrant:** Unified Suite + High UX Quality

---

## 5.4 Feature Comparison (High Level)

| Capability | Vastora | Zoho One | HubSpot | Keka | ERPNext |
|------------|---------|----------|---------|------|---------|
| CRM Pipeline | `[MVP]` | ✅ | ✅ | ❌ | ✅ |
| HRM / Payroll | `[MVP]` | ✅ | ❌ | ✅ | ✅ |
| Project Mgmt | `[MVP]` | ✅ | ❌ | ❌ | ✅ |
| Finance / GST | `[P1]` | ✅ | ❌ | Partial | ✅ |
| Support Desk | `[P1]` | ✅ | ✅ | ❌ | ✅ |
| AI Assistant | `[P1]` | Partial | ✅ | ❌ | ❌ |
| Modern UX | ✅ Target | ❌ | ✅ | ✅ | ❌ |
| Multi-tenant SaaS | `[MVP]` | ✅ | ✅ | ✅ | Self-host |
| Client Portal | `[P1]` | Partial | ✅ | ❌ | Partial |
| India GST | `[P1]` | ✅ | ❌ | ✅ | ✅ |

---

## 5.5 Differentiation Strategy

### 1. Unified Experience (Not App Switching)
Zoho One has 45 apps — users still feel like they're switching products. Vastora is **one app, one navigation, one design system**.

### 2. Modern UX as Core Competency
Not a skin on legacy architecture. Every interaction designed for 2026 standards: speed, clarity, keyboard shortcuts, smart defaults.

### 3. AI-Native Workflows
AI embedded in CRM emails, meeting summaries, lead scoring, resume parsing — not a separate "AI app."

### 4. Workflow Continuity
Lead → Deal → Project → Invoice is **one continuous flow**, not integrations between modules.

### 5. Transparent SMB Pricing
Simple tiers based on users + modules. No per-contact CRM pricing traps (HubSpot model).

### 6. India-First, Global-Ready
GST, Indian payroll conventions, UPI payment tracking — with architecture for global expansion.

---

## 5.6 Competitive Threats & Mitigations

| Threat | Mitigation |
|--------|------------|
| Zoho adds modern UI refresh | Move fast on UX moat; AI features; superior onboarding |
| HubSpot drops prices for SMB | Emphasize HRM + Projects unification HubSpot lacks |
| ERPNext cloud SaaS matures | Premium UX + managed SaaS + AI differentiation |
| New AI-first startups | Full module depth they won't have for years |
| Customer inertia ("we use Excel") | Free trial, data import, guided onboarding, ROI calculator |

---

## 5.7 Win/Loss Scenarios

### We Win When...

- Customer needs CRM + HR + Projects together
- Current Zoho UX frustrates their team
- HubSpot pricing exceeds budget at their contact volume
- ERPNext self-hosting is too complex
- Founder wants one dashboard for entire business

### We Lose When...

- Customer needs only CRM (HubSpot free tier sufficient)
- Enterprise needs SAP-level manufacturing ERP
- Customer requires deep India statutory payroll `[until P1 compliance complete]`
- Customer already invested 2+ years in Salesforce customization

---

## 5.8 Inspiration vs. Competition Boundary

| We Learn From | We Compete With | We Do NOT Clone |
|---------------|-----------------|-----------------|
| Zoho (density) | Zoho One (full suite) | Zoho's visual design |
| HubSpot (CRM flows) | HubSpot (CRM-only buyers) | HubSpot's orange UI |
| Linear (project UX) | Monday, Jira | Linear's dark theme |
| Keka (HR compliance) | Keka (HR-only buyers) | Keka's specific layouts |
| Stripe (dashboards) | — | Stripe's exact components |

---

## 5.9 Pricing Position (vs. Competitors)

| Tier | Vastora (Planned) | Zoho One | HubSpot Starter |
|------|-------------------|----------|-----------------|
| Entry | ₹999/user/mo | ~₹1,500/user/mo | ~₹800/user/mo (CRM only) |
| Growth | ₹1,499/user/mo | ~₹2,500/user/mo | ~₹3,200/user/mo |
| Scale | Custom | Custom | Custom |

*Detailed pricing in Chapter 7 — SaaS Business Model.*

---

**Previous:** [04 — Target Users & Personas](./04-target-users-personas.md)  
**Next:** [06 — Product Modules Overview](./06-product-modules.md)
