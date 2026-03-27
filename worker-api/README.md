# Verixa Worker API

This Worker is the backend layer for secrets and server-side integrations.

Use this when Cloudflare shows:

`Triggers cannot be added to a Worker that only has static assets`

That message means your frontend deployment is static-only. Secrets and triggers need a Worker backend.

## Setup

1. Create Worker secrets:

```bash
npm run worker:secret:openai
npm run worker:secret:n8n
```

2. Run locally:

```bash
npm run worker:dev
```

3. Deploy Worker:

```bash
npm run worker:deploy
```

## Endpoints

- `GET /api/health`
- `POST /api/openai` with `{ "prompt": "..." }`
- `POST /api/execute` forwards payload to `N8N_WEBHOOK_URL`
