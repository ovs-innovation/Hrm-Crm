# Vastora Infra Agent

Lightweight Node.js agent that exposes live VPS metrics for the Infrastructure module.

## Metrics

- CPU %, cores, load averages
- RAM total / used / %
- Disk (df mounts)
- Network rx/tx counters (`/proc/net/dev`)
- Docker containers (`docker ps`) when installed
- PM2 processes (`pm2 jlist`) when installed
- Nginx version + optional stub_status
- OS hostname, platform, uptime

## Auth

All `/metrics` requests require one of:

- `Authorization: Bearer <AGENT_TOKEN>`
- `X-Agent-Token: <AGENT_TOKEN>`

`AGENT_TOKEN` must match the token configured for the server in Infrastructure Settings.

## Run on VPS

```bash
cd infra-agent
export AGENT_TOKEN='your-shared-secret'
export PORT=9100
node src/index.js
```

Optional push to Vastora API:

```bash
export VASTORA_API_URL='https://api.example.com'
export VASTORA_SERVER_ID='<mongo Server _id>'
export PUSH_INTERVAL_SEC=60
node src/index.js
```

Firewall: allow only your Vastora backend IP to reach port `9100`, or terminate TLS via Nginx and keep the agent on localhost.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | no | Liveness |
| GET | `/metrics` | yes | Full metrics JSON |
