# Verexa AI Complete System Note

## 1. What Type of Website This Is

Verexa AI is an authenticated, memory-enabled AI assistant web application for rewriting, improving, and evaluating user text.

It is best described as:
- A SaaS-style conversational AI web app
- A writing and communication refinement assistant
- A hybrid of chat UI + quality scoring + persistent memory

Primary use cases:
- Rewrite rough messages into polished responses
- Generate professional answers in multiple intent modes
- Keep conversation context across turns
- Surface quality analytics (score, confidence, tone, reasoning)
- Persist session memory and user profile preferences

## 2. Product Experience (What Users See)

Main UI layout is a 3-pane app:
- Left pane: chat/session navigation and account dock
- Center pane: conversation thread + composer + mode selector
- Right pane: analysis inspector for latest/selected turn

User journey:
1. User signs in (email/password or Google) when Supabase is configured.
2. User starts a chat and enters a prompt.
3. App sends prompt and mode to backend.
4. Backend generates, verifies, scores, and returns a polished response.
5. Result is shown as assistant message with score/confidence/tone chips.
6. Turn is persisted to memory store (Cloudflare Worker + D1) when session is available.
7. User can reopen previous chats and continue with preserved context/history.

## 3. Core Functional Features

### 3.1 Prompt-to-Response Engine

- Input accepted in composer (minimum length gate in UI and backend validation).
- Mode-aware generation supported:
  - auto
  - coding
  - email
  - explain
  - brainstorm
  - proposal
  - reply
- Output is rewritten as a direct user-facing answer.

### 3.2 Verification and Scoring Layer

After generation, a verifier pass:
- Improves the generated response
- Scores quality (0-100)
- Scores confidence (0-100)
- Detects tone
- Lists issues found and improvements made
- Returns short reasoning

Pipeline retries with feedback when score is low.

### 3.3 Analysis Metadata in UI

Each assistant turn includes metadata chips:
- Score
- Confidence
- Tone

Inspector panel shows selected turn details:
- Score
- Confidence
- Tone
- Reasoning

### 3.4 Session Memory

Memory is implemented through a dedicated memory worker and D1 database.

Capabilities:
- Create sessions
- Store each conversation turn
- Retrieve chat history per session
- Search memory by text query
- Store and update profile facts inferred from user text

Memory-aware prompt handling exists for prompts like:
- "what did I ask before"
- "what is my name"
- "who am I"
- "did I ask about X"

### 3.5 Auth and Profile Personalization

Supabase features in frontend:
- Email/password sign in and sign up
- Google OAuth sign in
- Persistent auth session

Profile and policy panel stores:
- full name
- company
- role
- goals
- preferred tone
- response style
- memory mode
- factual strictness

These are written to Supabase table `user_profiles` (with RLS guidance in docs).

### 3.6 Chat Session Management

Frontend maintains:
- Active session ID in local storage (scoped by user)
- List of chat summaries in local storage (title/preview/time)
- Search over saved chats
- New chat reset behavior

If memory service is unavailable, frontend can generate local fallback session IDs and continue user flow.

## 4. Technical Architecture

System has 3 runtime services:

### 4.1 Frontend (Next.js + React)

Location:
- `frontend/`

Responsibilities:
- Chat user interface
- Auth UX via Supabase browser client
- API proxy route to backend
- Session and chat local state management
- Memory history hydration for active session

Important files:
- `frontend/app/page.tsx`
- `frontend/app/api/verexa/route.ts`
- `frontend/lib/api.ts`
- `frontend/lib/memory.ts`
- `frontend/lib/supabase/client.ts`

### 4.2 Backend (FastAPI + AI Pipeline)

Location:
- `backend/`

Responsibilities:
- Request validation
- Prompt generation + verification pipeline orchestration
- Quality grade derivation from score
- Memory prompt handling and memory/profile write-back
- CORS and environment-controlled security behavior

Important files:
- `backend/main.py`
- `backend/pipeline/generate.py`
- `backend/pipeline/verify.py`
- `backend/pipeline/critic.py`
- `backend/pipeline/memory.py`
- `backend/pipeline/utils.py`

### 4.3 Memory Worker (Cloudflare Worker + D1)

Location:
- `memory-worker/`

Responsibilities:
- REST API for sessions, memory history, search, and profile facts
- D1 persistence for sessions and memory items
- CORS handling and JSON body safety

Important files:
- `memory-worker/src/index.ts`
- `memory-worker/migrations/0001_init.sql`
- `memory-worker/migrations/0002_profile_facts.sql`

## 5. Request and Data Flow

### 5.1 Normal Generation Flow

1. Frontend calls `POST /api/verexa` (Next route).
2. Next route forwards payload to backend `POST /verexa`.
3. Backend validates input and mode.
4. Backend checks if prompt is memory-oriented and can be answered from stored history.
5. If not a memory answer, backend runs generate -> critique/verify pipeline.
6. Backend returns response payload including text + analytics.
7. If session exists, backend writes conversation item to memory worker and extracts profile facts.
8. Frontend refreshes memory history and renders latest turn.

### 5.2 Memory Query Flow

1. User asks memory-style question.
2. Backend `answer_memory_prompt()` runs before generation.
3. Backend fetches session history/profile facts from memory worker.
4. Backend builds grounded answer from stored data.
5. Backend returns memory-derived response with high confidence metadata.

## 6. Public/Internal APIs

### 6.1 Frontend Internal Proxy

- `POST /api/verexa`
  - Forwards request body to backend `/verexa`
  - Handles timeout and backend-unavailable errors

### 6.2 Backend API

- `GET /`
  - Health message

- `POST /verexa`
  - Request body fields:
    - `prompt` or `input`
    - `mode`
    - `session_id`
  - Response includes:
    - `verified_response`
    - `raw_input`, `normalized_input`
    - `mode`, `session_id`
    - `outputs` (professional/casual/short/persuasive)
    - `score`, `confidence`, `tone`, `grade`
    - `issues_found`, `improvements_made`, `reasoning`, `attempts`

### 6.3 Memory Worker API

- `GET /health`
- `POST /sessions`
- `POST /memory/write`
- `POST /memory/search`
- `POST /profile/upsert`
- `GET /sessions/:id/history`
- `GET /sessions/:id/profile`

## 7. Data Model (D1)

### 7.1 sessions
- id (PK)
- user_id
- title
- created_at
- updated_at

### 7.2 memory_items
- id (PK)
- session_id (FK -> sessions)
- user_input
- normalized_input
- verified_response
- mode
- score
- confidence
- tone
- reasoning
- created_at

### 7.3 profile_facts
- id (PK)
- session_id (FK -> sessions)
- fact_key
- fact_value
- confidence
- source
- created_at
- updated_at
- unique(session_id, fact_key)

## 8. AI Pipeline Design Details

### 8.1 Generator Step

- Builds prompt from mode instruction and optional feedback
- Produces first-pass polished response
- Returns normalized input and generated response

### 8.2 Verifier/Critic Step

- Enforces strict JSON output contract
- Produces:
  - verified_response
  - score
  - confidence
  - tone
  - issues_found
  - improvements_made
  - reasoning
- Normalizes score/confidence bounds to 0-100
- Normalizes tone to accepted values

### 8.3 Retry Loop

- Up to 2 attempts in `verify_pipeline`
- If score < threshold, issues are fed back into next generation pass
- Returns best available verified response

### 8.4 JSON Robustness

Pipeline has guardrails for model formatting instability:
- JSON extraction for object or array content
- Cleanup of smart quotes and trailing commas
- Explicit error snippets for debugging
- Fallback behavior when model returns invalid structure

## 9. Security and Reliability Characteristics

Implemented protections include:
- Backend CORS allowlist support via env
- Prompt/mode length and mode whitelist validation
- Frontend retries on transient statuses (408/425/429/5xx)
- Request timeout handling in frontend proxy and API clients
- Memory worker invalid JSON body handling (400)
- Upgraded Next.js version and cleaned vulnerabilities per fix notes

## 10. Environment and Configuration

### 10.1 Frontend env variables

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_MEMORY_API_URL`
- `NEXT_PUBLIC_MEMORY_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or anon key)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`

### 10.2 Backend env variables

- `GROQ_API_KEY`
- `MODEL_NAME`
- `MAX_TOKENS`
- `GROQ_TIMEOUT`
- `DEBUG_MODEL`
- `ALLOWED_ORIGINS`
- `MEMORY_WORKER_URL`
- `RENDER` or `RENDER_EXTERNAL_URL` (runtime detection behavior)

### 10.3 Memory worker env/config

- `ALLOWED_ORIGINS`
- D1 binding `DB`
- Wrangler config for worker name and database binding

## 11. Current UI Implementation Status

Active in main app flow:
- AuthPanel
- ProfileDock
- ProfilePolicyPanel
- HistoryItem type (from HistoryPanel)

Present in repository but not currently mounted in main page:
- InputBox
- ResultPanel
- DiffViewer
- InsightsPanel
- ScoreCard
- HistoryPanel visual component itself

This suggests the project has an earlier modular UI layer plus a newer integrated chat layout in `app/page.tsx`.

## 12. Deployment Topology

Potential deployment split based on configs/docs:
- Frontend:
  - Next.js local dev with `next dev`
  - Optional Cloudflare deployment via OpenNext + Wrangler
- Backend:
  - FastAPI on Render (or similar host)
- Memory API:
  - Cloudflare Worker backed by D1
- Auth/Profile:
  - Supabase managed service

## 13. Dependencies Snapshot

Frontend:
- Next.js 15
- React 19
- Supabase JS
- Framer Motion
- OpenNext Cloudflare tooling

Backend:
- FastAPI
- Uvicorn
- Pydantic v2
- Requests
- Python dotenv

Memory worker:
- Wrangler
- Cloudflare Workers runtime + D1

## 14. What This Website Is Best At

- Turning rough, human text into cleaner professional output
- Providing transparent quality signals (score/confidence/tone)
- Keeping per-session conversational continuity
- Mixing AI generation with deterministic memory retrieval
- Supporting user identity and personalization controls

## 15. Known Constraints and Notes

- If Supabase env vars are absent, auth/profile UI is disabled with an explanatory message.
- If memory worker is unavailable, app still works in degraded mode with local session behavior.
- Some profile policy settings are saved but not yet deeply injected into generation prompts.
- Main UI label has spelling variant "Verixa" while repo/project name is "Verexa".
- API base URL fallback logic may switch to production endpoint in production when local URL is configured.

## 16. Quick Functional Checklist

- Chat generation: implemented
- Mode switching: implemented
- Verification scoring: implemented
- Reasoning/quality metadata: implemented
- Chat history persistence: implemented
- Memory search and memory Q&A: implemented
- Auth and account controls: implemented
- User profile and policy save: implemented
- Cloud deployment scaffolding: implemented
- Security/reliability hardening: implemented

## 17. Suggested Next Improvements (Optional)

- Inject saved profile policy fields into backend generation and verifier prompts.
- Add monitoring/telemetry around memory worker failures and verifier parse fallbacks.
- Add automated tests for:
  - backend pipeline contract
  - memory endpoints
  - frontend API retry and timeout behavior
- Either remove or integrate currently unused UI components to reduce maintenance overhead.
- Add explicit API schema docs (OpenAPI examples for `/verexa` and memory endpoints).
