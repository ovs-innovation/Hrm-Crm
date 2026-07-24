# Chapter 1 — Lead Sources & Capture Channels

**Book:** 2 — CRM PRD · **Part:** 2 — Leads · **Chapter:** 1  
**Version:** 1.0.0-draft

---

## 1.1 Overview

A **Lead** is an unqualified sales prospect — a person or inquiry that has shown interest but is not yet validated as a sales opportunity. Lead capture is the **top of the revenue funnel** and must support multiple inbound channels without duplicate chaos.

---

## 1.2 Lead Sources (Predefined)

| Source ID | Display Name | Default | Description |
|-----------|--------------|---------|-------------|
| `website` | Website Form | ✅ | Embedded or hosted web form |
| `manual` | Manual Entry | ✅ | Rep creates lead in UI |
| `import` | CSV Import | ✅ | Bulk upload |
| `referral` | Referral | ✅ | Existing client/partner referral |
| `cold_call` | Cold Call | ✅ | Outbound prospecting |
| `linkedin` | LinkedIn | ✅ | Social prospecting |
| `email` | Email Inquiry | ✅ | Parsed inbound email `[P1]` |
| `whatsapp` | WhatsApp | ✅ | WhatsApp Business message `[P1]` |
| `trade_show` | Trade Show / Event | ✅ | Event capture |
| `advertisement` | Advertisement | ✅ | Paid ads (Google, Meta) |
| `api` | API / Integration | ✅ | External system webhook |
| `custom_*` | Custom Source | — | Tenant-defined (max 20) |

Sources are configurable in **CRM Settings → Lead Sources**. System sources cannot be deleted, only hidden.

---

## 1.3 Capture Channels

### Channel 1 — Manual Entry (MVP)

**Route:** `/crm/leads/new` or Quick Add modal  
**Permission:** `crm:lead:create`

User fills form → duplicate check runs → lead created → assignment rule runs → notification sent to owner.

### Channel 2 — CSV Import (MVP)

**Route:** `/crm/leads/import`  
**Permission:** `crm:lead:import`

Upload CSV → column mapping → validation preview → duplicate review → bulk create. See [Chapter 6](./06-lead-import-csv.md).

### Channel 3 — Web Form (MVP)

**Endpoint:** `POST /api/public/v1/leads` (API key auth)

Embedded iframe or standalone hosted form:

```
https://{tenant}.vastora.com/forms/{form_id}
```

Form fields configurable per tenant. Submissions create leads with `source = website`.

**Security:** Rate limit 100/hour per tenant; honeypot field; optional reCAPTCHA `[P1]`.

### Channel 4 — REST API (MVP)

**Endpoint:** `POST /api/v1/crm/leads`  
**Auth:** Bearer JWT or API key (tenant-scoped)

For integrations: landing pages, Zapier `[P2]`, custom apps.

### Channel 5 — Email Parsing `[P1]`

Dedicated inbox: `leads+{tenant_slug}@inbound.vastora.com`

Inbound email → parse From, Subject, Body → create lead → attach email as activity.

### Channel 6 — WhatsApp Business `[P1]`

WhatsApp message to connected business number → create lead with phone match → conversation logged as activity.

---

## 1.4 Lead Capture Form — Default Fields

| Field | Required | Validation |
|-------|----------|------------|
| First Name | ✅ | 1–100 chars |
| Last Name | ❌ | 0–100 chars |
| Email | ✅* | Valid email format |
| Phone | ✅* | E.164 or 10-digit Indian mobile |
| Company Name | ❌ | 0–200 chars |
| Job Title | ❌ | 0–100 chars |
| Lead Source | ✅ | Enum from sources list |
| Description / Notes | ❌ | 0–5000 chars |
| Expected Value | ❌ | Positive number |
| Custom Fields | ❌ | Per tenant config `[P1]` |

*At least one of Email or Phone required.

---

## 1.5 Web Form Builder `[P1]`

Tenant admin configures public forms:

| Setting | Options |
|---------|---------|
| Form name | Text |
| Fields | Toggle from available lead fields + custom fields |
| Required fields | Per-field toggle |
| Success message | Custom text + redirect URL |
| Notification | Email to assigned rep or team |
| Branding | Logo, primary color override |
| Embed code | `<iframe>` snippet |

---

## 1.6 Source Attribution Rules

1. **First-touch attribution:** Lead source set at creation, immutable by default
2. **Source override:** `sales_manager+` can change source with audit log
3. **UTM tracking `[P1]`:** Store `utm_source`, `utm_medium`, `utm_campaign` on web form leads
4. **Reports:** All funnel reports filterable by source

---

## 1.7 Business Rules

| Rule | Description |
|------|-------------|
| LR-001 | Every lead must have `tenant_id`, `source`, and `status = new` on create |
| LR-002 | Email normalized to lowercase before save |
| LR-003 | Phone normalized to digits-only for duplicate check |
| LR-004 | Public form submissions auto-assign via assignment rules |
| LR-005 | Leads without owner appear in "Unassigned" queue for managers |
| LR-006 | Max 10,000 leads imported per batch; 50,000 per tenant per day |

---

**Next:** [02 — Lead Data Model & Fields](./02-lead-data-model.md)
