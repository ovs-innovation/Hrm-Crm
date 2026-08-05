# NovaTech Demo Workspace (FCX Week 1)

## One-click
Admin login → **Explore Demo Company** → seeds (if needed) + signs in as CEO.

## CLI
```bash
cd Backend
npm run seed:novatech          # idempotent
npm run seed:novatech:force    # wipe + reseed this tenant only
```

## Credentials
| Role | Email | Password |
|------|-------|----------|
| Founder / CEO | ceo@novatech.demo | Demo@NovaTech2026 |
| HR | hr@novatech.demo | Demo@NovaTech2026 |
| Sales | sales@novatech.demo | Demo@NovaTech2026 |

Override password with `DEMO_PASSWORD` in `.env`.

## Seeded (verified)
- 52 employees (incl. **Rahul Sharma NT-002**)
- 218 leads + 19 customers
- 34 deals, 19 invoices, 8 projects
- 1144 attendance rows (22 working days)
- 104 payslips (2 cycles)
- Meetings, calls, campaigns, jobs/applications
- Assets/docs, appreciations, tickets, announcements
- Notifications, 30-day activity timeline
- AI memories + 7 prior AI conversations

## APIs
- `GET /api/demo/workspace`
- `POST /api/demo/workspace/ensure` `{ force?: true }`
- `POST /api/demo/workspace/explore` — ensure + cookie session
