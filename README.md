# verixa

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
