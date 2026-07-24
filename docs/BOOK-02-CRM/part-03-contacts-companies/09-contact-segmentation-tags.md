# Chapter 9 — Contact Segmentation & Tags

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 9  
**Version:** 1.0.0-draft

---

## 9.1 Tags vs Segments

| Concept | Purpose | Example |
|---------|---------|---------|
| **Tag** | Manual/ad-hoc label on contact or company | `enterprise`, `vip`, `referral-2026` |
| **Segment** | Dynamic or static group for targeting/reports | "Enterprise customers in North", "Inactive 90 days" |

---

## 9.2 Table: `tags`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | |
| `tenant_id` | UUID | |
| `name` | VARCHAR(50) | Lowercase slug stored; display capitalized |
| `color` | CHAR(7) | Hex color for chip |
| `entity_type` | ENUM | `contact`, `company`, `both` |
| `created_at` | TIMESTAMP | |

**Unique:** `(tenant_id, lower(name), entity_type)`

---

## 9.3 Table: `contact_tags` / `company_tags`

| Column | Type |
|--------|------|
| `tenant_id` | UUID |
| `contact_id` or `company_id` | UUID |
| `tag_id` | UUID |
| `created_by` | UUID |
| `created_at` | TIMESTAMP |

---

## 9.4 Segments

**Table:** `crm_segments`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | |
| `tenant_id` | UUID | |
| `name` | VARCHAR(100) | |
| `entity_type` | ENUM | `contact`, `company` |
| `type` | ENUM | `static`, `dynamic` |
| `filter_rules` | JSONB | Dynamic filter definition |
| `member_count` | INT | Cached count |
| `last_computed_at` | TIMESTAMP | |

### Dynamic Filter Rules (JSONB example)

```json
{
  "operator": "AND",
  "rules": [
    { "field": "status", "op": "eq", "value": "active" },
    { "field": "company.industry", "op": "eq", "value": "IT Services" },
    { "field": "last_activity_at", "op": "lt_days", "value": 30 },
    { "field": "tags", "op": "contains", "value": "enterprise" }
  ]
}
```

Segments recomputed nightly + on-demand refresh button.

---

## 9.5 UI — Tag Management

```
Contact 360 → Tags section → + Add tag
  → Typeahead existing tags or create new
  → Colored chip appears
  → Click × to remove
```

Bulk tag from list page (Chapter 4).

**Settings:** `/crm/settings/tags` — manage tag colors, merge tags, delete unused.

---

## 9.6 UI — Segment Builder `[P1]`

```
CRM → Contacts → Views → + Create Segment
  → Name + entity type
  → Visual rule builder (field / operator / value)
  → Preview count live
  → Save → appears in Views dropdown
```

---

## 9.7 Use Cases

| Use Case | Implementation |
|----------|----------------|
| Marketing list export | Filter segment → Export CSV |
| Sales territory | Tag `north-region` + owner filter |
| Re-engagement campaign | Dynamic: inactive 60 days |
| Enterprise accounts | Company segment: employee_count > 200 |

---

## 9.8 API

**POST** `/api/v1/crm/contacts/:id/tags` `{ "tag_names": ["enterprise"] }`  
**DELETE** `/api/v1/crm/contacts/:id/tags/:tagId`  
**GET** `/api/v1/crm/segments?entity_type=contact`  
**POST** `/api/v1/crm/segments` — create segment  
**GET** `/api/v1/crm/segments/:id/members?page=1` — list members

---

## 9.9 Tenant Scope

Tags and segments unique per tenant; segment rules cannot reference other tenants.

---

## 9.10 Permissions

| Action | Permission |
|--------|------------|
| Add/remove tag on own contact | `crm:contact:update` |
| Bulk tag | `crm:contact:update_all` |
| Manage tags (settings) | `crm:settings:manage` |
| Create segment | `crm:settings:manage` or `sales_manager` |
| View segment | `crm:contact:read_all` |

---

## 9.11 Audit Log

`contact.tag_added`, `contact.tag_removed`, `segment.created`, `segment.updated`

---

## 9.12 Responsive

Tag chips wrap on mobile; segment builder uses stacked rule rows on narrow screens.

---

## 9.13 Acceptance Criteria

- [ ] Tags on contacts and companies with color chips
- [ ] Create tag inline without leaving profile
- [ ] Static segment: manual member add/remove `[P1]`
- [ ] Dynamic segment: filter rules execute correctly
- [ ] Segment member count updates on refresh
- [ ] Max 50 tags per contact; max 100 tags per tenant `[configurable]`
- [ ] Tags filterable on contact/company list

---

**Next:** [10 — Unified Timeline](./10-contact-timeline.md)
