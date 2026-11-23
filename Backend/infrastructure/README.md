# Infrastructure module

Isolated DevOps monitoring for the Admin portal. Mounted at `/api/infrastructure`. Does not touch HRM routes or models.

## Access

- Admin portal only (`userType === 'Admin'`)
- Roles: `admin`, `founder`, `owner`

## Real data sources

| Signal | Source |
|--------|--------|
| VPS CPU/RAM/Disk (Hostinger) | Hostinger VPS API `/api/vps/v1/virtual-machines/{id}/metrics` |
| VPS deep metrics | `infra-agent` on the VPS (CPU, RAM, Disk, Net, Docker, PM2, Nginx, OS) |
| Website uptime / latency | Live HTTP GET health checks |
| SSL expiry | Live TLS peer certificate (`valid_from` / `valid_to`) |
| Domain expiry | RDAP lookup, else stored registrar metadata |

Unavailable metrics stay `null` — the dashboard never invents zeros.

## Agent

Package: repo root `infra-agent/`.

### Push (agent → API)

```http
POST /api/infrastructure/agent/metrics
POST /api/infrastructure/agent/ingest
Authorization: Bearer <token>
X-Infra-Agent-Token: <token from Infrastructure → Settings>
X-Server-Id: <mongo Server _id>
Content-Type: application/json

{
  "serverId": "<mongo id>",
  "metrics": { "...agent collectAll() payload..." }
}
```

### Pull (API → agent)

Set `agentBaseUrl` on the server (e.g. `http://10.0.0.5:9100`). Jobs call `GET {agentBaseUrl}/metrics` with the tenant agent token every minute.

## Providers

Pluggable under `providers/`: `local` (agent), `hostinger` (API token). Add AWS/Azure/etc. by implementing `BaseMonitoringProvider`.

## Jobs

Started from `Backend/index.js` via `startInfrastructureJobs()`. Disable with `INFRA_JOBS_DISABLED=true`.

- Website checks: every 60s  
- Hostinger + agent pull: every 60s  
- SSL / domain live refresh: daily (and once shortly after boot)  
