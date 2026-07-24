# Chapter 11 — Contact Communication Center

**Book:** 2 — CRM PRD · **Part:** 3 — Contacts & Companies · **Chapter:** 11  
**Version:** 1.0.0-draft

---

## 11.1 Purpose

The **Communication Center** consolidates outbound/inbound channels from Contact 360 header actions: Email, Call logging, WhatsApp, and meeting scheduling. Emails and WhatsApp messages auto-attach to Timeline.

---

## 11.2 Entry Points

| Trigger | Channel |
|---------|---------|
| Header [Email] button | Email compose drawer |
| Header [Call] button | Log call modal (click-to-call `[P2]`) |
| Header [WhatsApp] button | WhatsApp panel `[P1]` |
| Header [Schedule] | Meeting scheduler `[P1]` |
| Timeline + Log Activity | All types |

---

## 11.3 Email Compose Drawer (Desktop)

```
┌─────────────────────────────────────────┐
│ Email to John Smith                 [×] │
├─────────────────────────────────────────┤
│ To: john@abc.com                        │
│ Template: [Follow-up after demo ▾]      │
│ Subject: [Re: Enterprise proposal    ]  │
│ ┌─────────────────────────────────────┐ │
│ │ Rich text body                      │ │
│ │ [AI Draft ✨]                        │ │
│ └─────────────────────────────────────┘ │
│ Attachments: [+ Add]                    │
│ ☑ Log to timeline                       │
│ ☐ Schedule send [P1]                    │
│              [Cancel]  [Send]           │
└─────────────────────────────────────────┘
```

### Email Integration `[P1]`

- SMTP / Gmail OAuth / Outlook OAuth per tenant
- Sent emails stored in `email_messages` table linked to contact
- Inbound sync creates timeline entries
- Templates from Part 10 — Automation

---

## 11.4 AI Email Draft `[P1]`

**POST** `/api/v1/crm/ai/draft-email`

```json
{
  "contact_id": "uuid",
  "context": "follow_up_after_demo",
  "tone": "professional",
  "deal_id": "uuid"
}
```

Returns draft subject + body; user edits before send. Logged as `ai_email_drafted` activity.

---

## 11.5 Call Logging

MVP: manual log only (no telephony integration).

| Field | Required |
|-------|----------|
| Outcome | Connected / No answer / Voicemail / Wrong number |
| Duration | Minutes |
| Notes | Optional |
| Schedule follow-up task | Optional checkbox |

Click-to-call via `tel:` URI on mobile.

---

## 11.6 WhatsApp Business `[P1]`

```
┌─────────────────────────────────────────┐
│ WhatsApp — John Smith               [×] │
├─────────────────────────────────────────┤
│ [Conversation history scroll area]      │
│                                         │
│ Template: [Invoice reminder ▾]          │
│ Message: [                            ] │
│              [Send via WhatsApp]        │
└─────────────────────────────────────────┘
```

- Requires WhatsApp Business API integration (tenant settings)
- Blocked if contact `status = dnc` unless admin override
- Messages logged to timeline type=`whatsapp`

---

## 11.7 Meeting Scheduler `[P1]`

- Title, date/time, duration, attendees (contact + internal users)
- Google/Outlook calendar sync
- Reminder notification 15 min before
- Creates `meeting` activity + calendar event

---

## 11.8 DNC Enforcement

| Channel | If contact.status = dnc |
|---------|-------------------------|
| Email | Block send; show error |
| WhatsApp | Block send |
| Call log | Allowed (inbound callback logging) |
| Meeting invite | Warn + require manager approval |

---

## 11.9 API — Send Email `[P1]`

**POST** `/api/v1/crm/contacts/:id/emails`

```json
{
  "to": "john@abc.com",
  "subject": "Follow-up",
  "body_html": "<p>...</p>",
  "template_id": "uuid",
  "log_to_timeline": true
}
```

---

## 11.10 Tenant Scope

Email/WhatsApp credentials per tenant; cannot send from another tenant's integration.

---

## 11.11 Permissions

| Action | Permission |
|--------|------------|
| Send email | `crm:activity:create` + email integration configured |
| Log call | `crm:activity:create` |
| Send WhatsApp | `crm:activity:create` + WhatsApp enabled |
| Use AI draft | AI module enabled + user has AI quota |

---

## 11.11 Audit Log

`email.sent`, `email.failed`, `whatsapp.sent`, `call.logged`, `meeting.scheduled`

---

## 11.12 Responsive

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Email as right drawer (480px) |
| Tablet | Full-width drawer |
| Mobile | Full-screen compose; native tel: and mailto: for quick actions |

---

## 11.13 Acceptance Criteria

- [ ] Log call modal creates timeline entry
- [ ] Email drawer opens from Contact 360 header
- [ ] DNC blocks outbound email/WhatsApp with clear message
- [ ] Email templates populate subject/body `[P1]`
- [ ] AI draft button returns editable content `[P1]`
- [ ] All communications update last_contacted_at
- [ ] Mobile: tel: link initiates phone dialer

---

**Next:** [12 — Technical Spec & Acceptance](./12-contact-technical-spec.md)
