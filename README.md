# VerixaAI / Verixa

Working-first AI Action Execution Interface.

Current flow:

User Input -> Action Generation -> Risk + Decision -> Fix/Send/Reject

## Pages

- `/actions`: core working interface
- `/dashboard`: read-only insights (metrics, actions-over-time graph, recent activity)
- `/settings`: control panel for API, policy, execution, integrations
- `/logs`: local history list

## Buttons

- `Send` -> posts execute event to webhook
- `Fix` -> replaces content with webhook-provided `improved_version`
- `Reject` -> clears current action
- `+ New Agent` -> opens modal and saves agent config to global state

## Run Locally

```bash
npm install
npm run dev
```

## Deploy To Render

This repo is a Vite static site, not a Python app.

If Render shows a build step like:

```bash
pip install -r requirements.txt
```

then the service was created with the wrong runtime.

Use the included [`render.yaml`](./render.yaml) as a Blueprint, or create a **Static Site** manually with:

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Rewrite Rule: `/*` -> `/index.html`
- Environment Variable: `VITE_CLERK_PUBLISHABLE_KEY`

If you already created a Python service on Render, delete it and create a new Static Site or Blueprint deployment instead.

## Clerk Authentication Setup

This project now uses [Clerk](https://clerk.com/) for authentication with:
- Sign up (new user)
- Sign in (existing user)
- Google social login

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment variables
Copy `.env.example` to `.env` and set your Clerk publishable key:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key
```

### 3) Clerk dashboard configuration
In your Clerk dashboard:
- Enable **Email/Password** authentication
- Enable **Google** social connection

### 4) Run locally
```bash
npm run dev
```

### Auth behavior implemented
- `/login` shows Clerk Sign In / Sign Up experience.
- Users can create a new account, sign in with existing credentials, or use Google.
- Authenticated users are redirected to `/dashboard`.
- `/dashboard` and `/logs` are protected routes and redirect unauthenticated users to `/login`.

## Cloudflare Worker Backend (for ENV keys and triggers)

If Cloudflare shows:

`Triggers cannot be added to a Worker that only has static assets`

it means your current deployment is static-only. Secrets like `OPENAI_API_KEY` must live in a Worker backend.

### Hybrid architecture

Frontend (Vite static site) -> Worker API -> OpenAI / n8n

### Worker setup

```bash
npm run worker:secret:openai
npm run worker:secret:n8n
npm run worker:deploy
```

Worker files are under [`worker-api/`](./worker-api).
