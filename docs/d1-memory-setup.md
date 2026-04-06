# Verexa D1 Memory Setup

This is the recommended free memory starter for Verexa:

- Cloudflare D1 for structured memory
- Cloudflare Worker as the memory API
- FastAPI backend on Render continues to handle generation

## What this gives you

- Real session memory
- Exact history retrieval
- A clean base for advanced memory later
- Better anti-hallucination behavior than fake "memory"

## Files added

- `memory-worker/wrangler.jsonc`
- `memory-worker/src/index.ts`
- `memory-worker/migrations/0001_init.sql`

## Step-by-step

### 1. Install Wrangler in the memory worker folder

```powershell
cd memory-worker
npm install
```

### 2. Log into Cloudflare

```powershell
npx wrangler login
```

### 3. Create the D1 database

```powershell
npx wrangler d1 create verexa-memory
```

Cloudflare will print a `database_id`.

Copy that ID into:

- `memory-worker/wrangler.jsonc`

Replace:

```json
"database_id": "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```

### 4. Run the schema locally first

```powershell
npx wrangler d1 execute verexa-memory --local --file=./migrations/0001_init.sql
```

### 5. Apply the schema remotely

```powershell
npx wrangler d1 execute verexa-memory --remote --file=./migrations/0001_init.sql
```

### 6. Start the worker locally

```powershell
npx wrangler dev
```

Test:

- `GET /health`
- `POST /sessions`
- `POST /memory/write`
- `GET /sessions/:id/history`
- `POST /memory/search`

### 7. Deploy the worker

```powershell
npx wrangler deploy
```

After deploy, you will get a Worker URL.

## Recommended next integration

1. Frontend creates a `sessionId` once
2. Backend calls the memory worker after each successful generation
3. Backend queries memory before answering memory-related prompts
4. If no real memory is found, Verexa must say it does not know

## Example write payload

```json
{
  "sessionId": "session_123",
  "userInput": "tell me your name",
  "normalizedInput": "tell me your name",
  "verifiedResponse": "I'm Verexa AI, your assistant for auditing and improving communication.",
  "mode": "auto",
  "score": 88,
  "confidence": 92,
  "tone": "professional",
  "reasoning": "The final response is direct, clear, and appropriate to the user's request."
}
```

## Why this is only phase one

D1 gives you exact memory and structured history. For more advanced semantic memory later, you can add vector search on top of this.

For now, this is the best free serious starting point.
