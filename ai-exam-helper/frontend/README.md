# ExamHelper — Frontend (Demo Mode)

React 18 + TypeScript + Vite. This build runs **standalone with seeded demo data** — no backend, no API key, no database.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@examhelper.com` | `Admin@12345` |
| Student | `student@examhelper.com` | `Student@12345` |

The signup form creates a new in-memory student account.

## What's included

- **Dashboard** — counts, recent papers, recent quizzes
- **Past Papers** — 6 seeded papers across CS / Math / Physics with search, subject, and year filters. Admin can upload (metadata only) and delete. Downloads emit a small text stub.
- **AI Tutor** — keyword-driven mock replies (markdown-formatted) across 2 seeded sessions; new sessions auto-create on first message.
- **Quizzes** — a 12-question bank powers `Generate quiz`; submit to see per-question scoring and explanations. Two seeded quiz results show up in History.
- **Admin Panel** — user list, system stats, user deletion.

## How the demo layer works

- [src/lib/demoData.ts](src/lib/demoData.ts) holds in-memory state (users, papers, sessions, quizzes) plus the question bank and the mock AI reply generator.
- [src/lib/api.ts](src/lib/api.ts) keeps the same `axios` instance the pages already use, but swaps its `adapter` so every request is routed to `demoData` instead of going over the network. All pages are unchanged.
- Auth uses `localStorage` for the session token (`demo-{userId}`), so refreshes keep you signed in. All other state resets on full page reload.

## Pointing back at a real backend

To re-enable a real backend later, restore [src/lib/api.ts](src/lib/api.ts) to use a `baseURL` (e.g. `import.meta.env.VITE_API_BASE_URL`) and remove the `api.defaults.adapter = ...` block. The page components don't need to change.

## Stack

React 18 · TypeScript · Vite 5 · Tailwind CSS · React Router 6 · Axios · Lucide icons · React Markdown (+ GFM)
