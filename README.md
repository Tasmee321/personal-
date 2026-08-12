# KYNEX — auth demo (real OTP)

Two parts:

- `backend/` — Node/Express server. Sends real OTP emails, blocks duplicate
  signups by email, verifies OTP, handles login.
- `KynexAuth.jsx` — React frontend (register → OTP → login).

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `SMTP_USER` / `SMTP_PASS` — a Gmail address + an **App password**
  (not your normal Gmail password). Create one at
  https://myaccount.google.com/apppasswords (needs 2-Step Verification on).
- Change `JWT_SECRET` to any random long string.

Run it:

```bash
npm start
```

Server runs at `http://localhost:4000`.

## 2. Frontend setup

If this isn't already inside a Vite project:

```bash
npm create vite@latest kynex-frontend -- --template react
cd kynex-frontend
npm install
```

Copy `KynexAuth.jsx` into `src/`, then in `src/App.jsx`:

```jsx
import KynexAuth from "./KynexAuth";
export default function App() {
  return <KynexAuth />;
}
```

If your backend runs on a different host/port, create `.env` in the
frontend project:

```
VITE_API_URL=http://localhost:4000
```

Run it:

```bash
npm run dev
```

## How the real OTP + duplicate-email flow works

1. User submits the register form → `POST /api/register`.
   - Backend checks `data/users.json` for that email. If it already
     exists, it returns an error immediately — no OTP is sent, so the
     same Gmail can't sign up twice.
   - If the email is new, backend generates a 6-digit code, stores it
     in memory against that email (expires in 10 minutes), and sends
     it via Nodemailer/SMTP to the real inbox.
2. User enters the code → `POST /api/verify-otp`.
   - Backend compares the code, and only *then* writes the user to
     `data/users.json` (password stored as a bcrypt hash, never plain
     text).
3. `POST /api/login` checks email + password against that same file.

## Before this goes to real users

- Swap `data/users.json` for a real database (Postgres/MySQL/Mongo) —
  a JSON file works for local testing but isn't safe for concurrent
  writes or production traffic.
- Move `VALID_REFERRAL_CODES` into a database table you can update
  without redeploying.
- Add rate-limiting on `/api/register` and `/api/verify-otp` so someone
  can't spam OTP requests or brute-force a code.
- Never commit your real `.env` file — `backend/.env` should be in
  `.gitignore`.
