# Production Deployment Guide — Vastora v1.0.0-rc2

## Prerequisites

- Node.js 20+
- MongoDB 7+
- Optional: Redis (`REDIS_URL`) for multi-instance cache
- SMTP credentials for real email
- AI provider keys (`GROQ_API_KEY` and/or `GEMINI_API_KEY` for RAG)

## Environment checklist

Copy `Backend/.env.example` → `Backend/.env` and set at minimum:

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `MONGO_URI` | yes | Prefer replica set for transactions later |
| `JWT_SECRET` | yes | Long random string; rotate on incident |
| `JWT_EXPIRES_IN` | yes | Access TTL, default `15m` |
| `REFRESH_TOKEN_DAYS` | no | Default `14` |
| `CORS_ORIGIN` | yes | Exact SPA origins, comma-separated |
| `ALLOW_ADMIN_SIGNUP` | yes | Must be `false` in prod after bootstrap |
| `ALLOW_TENANT_HEADER` | yes | Must stay `false` in prod |
| `COOKIE_SECURE` | yes | `true` behind HTTPS |
| `REDIS_URL` | no | `redis://redis:6379` |

## Docker Compose

```bash
docker compose up -d --build
```

Services: `mongo`, `backend` (:3072), `admin` (:3070), `frontend` (:3071).

Health:

- Liveness: `GET /health`
- Readiness (DB): `GET /ready`

## First boot / tenant backfill

1. Start API once so default tenant can exist (non-prod) **or** create Tenant manually.
2. Backfill legacy rows:

```bash
cd Backend
npm run backfill:tenant
```

3. Create first admin with bootstrap secret if admins already exist:

```bash
curl -X POST /api/auth/admin/signup \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: $ADMIN_BOOTSTRAP_SECRET" \
  -d '{"name":"Ops","email":"ops@company.com","password":"...","bootstrapSecret":"..."}'
```

4. Immediately set `ALLOW_ADMIN_SIGNUP=false`.

## Auth sessions (RC2)

- Access JWT cookie `jwt` (short-lived)
- Refresh cookie `refreshToken` (rotated on `/api/auth/refresh`)
- Reuse of an old refresh token revokes the entire session family
- `POST /api/auth/logout-all` + `tokenVersion` bump invalidates access tokens
- `GET /api/auth/sessions` lists active devices

## Backup

```bash
mongodump --uri="$MONGO_URI" --out=/backups/vastora-$(date +%F)
```

Retain daily dumps ≥ 14 days. Store off-box.

## Restore

```bash
mongorestore --uri="$MONGO_URI" --drop /backups/vastora-YYYY-MM-DD
```

Verify `/ready` and smoke login after restore.

## Rollback

1. Keep previous Docker image tag (`backend:1.0.0-rc1`).
2. `docker compose up -d backend` with previous tag.
3. If schema migration broke indexes, restore DB dump from pre-deploy backup.
4. Do **not** force-push or drop `tenantId` without a restore plan.

## Disaster recovery (RTO/RPO targets)

| Tier | RPO | RTO | Action |
|---|---|---|---|
| Config/.env loss | 0 | 30m | Restore secrets from vault |
| Mongo primary loss | ≤ 24h | 2h | Restore latest dump to new cluster |
| Full region | ≤ 24h | 4h | Redeploy compose + restore dump |

## Monitoring

- Hit `/ready` from uptime checker every 60s
- Alert on 5xx rate, AI 429s, Mongo disconnect
- Review `AILog` cost/latency daily
- Review `AuditLog` for privilege changes

## Security ops

- Rotate `JWT_SECRET` → forces re-login (also bump user `tokenVersion` or wipe RefreshToken collection)
- Dependency audit: `npm audit --omit=dev`
- Never commit `.env`
- Keep `ALLOW_TENANT_HEADER=false`

## Post-deploy smoke

1. Admin login → refresh → logout
2. Create employee + lead under tenant A
3. Confirm tenant B cannot read them (isolation test suite)
4. AI agent command with known employee context
5. Payslip generate (admin only)
