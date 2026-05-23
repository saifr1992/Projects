# AI Exam Helper

An AI-powered web application that helps university students prepare for exams. Students can browse and download past papers, chat with an AI tutor about concepts, and generate auto-graded MCQ quizzes from any topic or past paper.

This is a Final Year Project (FYP) implementation.

> **Current state — frontend-only demo.** The app runs entirely from the `frontend/` directory with seeded demo data. No backend, database, or OpenAI key is required to try every screen. The `backend/` directory is kept for reference and can be re-attached later.

## Features

- **Authentication** — Seeded admin + student accounts. Sign up creates additional in-memory students.
- **Past Papers** — 6 seeded papers across CS / Math / Physics with search and filtering. Admin upload/delete works in-memory; downloads emit a text stub in demo mode.
- **AI Tutor** — Persistent chat sessions with markdown-formatted mock replies (keyword-driven across topics like Big-O, dynamic programming, recursion, derivatives, integrals).
- **Quiz Generation** — Multiple-choice quizzes drawn from a 12-question bank, auto-scored with per-question explanations.
- **Dashboard** — Recent papers, chat sessions, quizzes, and average-score widget.
- **Admin Panel** — User management and system stats.

## Tech Stack

**Frontend (active)**
- React 18 + TypeScript
- Vite 5
- Tailwind CSS + custom component primitives
- React Router 6
- Axios (with a custom adapter that serves demo data instead of HTTP)
- Lucide icons
- React Markdown (with GFM) for rendering AI responses

**Backend (paused — kept on disk for reference)**
- Python 3.10+, FastAPI, SQLAlchemy 2.0, JWT auth, OpenAI Python SDK

## Project Structure

```
FYP/
├── backend/              # FastAPI + SQLAlchemy — not used by the demo
└── frontend/
    ├── src/
    │   ├── components/   # Layout, ProtectedRoute
    │   ├── context/      # AuthContext
    │   ├── lib/
    │   │   ├── api.ts        # axios instance with a mock adapter
    │   │   ├── demoData.ts   # seeded users / papers / sessions / quizzes
    │   │   ├── types.ts
    │   │   └── cn.ts
    │   ├── pages/        # Login, Signup, Dashboard, Papers, Chat, Quiz, Admin
    │   ├── App.tsx
    │   └── main.tsx
    ├── tailwind.config.js
    └── package.json
```

## Setup

### Prerequisites
- Node.js 20+

### Run the demo

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

### Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@examhelper.com` | `Admin@12345` |
| Student | `student@examhelper.com` | `Student@12345` |

You can also sign up — new accounts become students in memory.

### Notes on demo state

- The session token (`demo-{userId}`) is stored in `localStorage`, so refreshes keep you signed in.
- All other state (papers you upload, sessions you start, quizzes you take) lives in memory and resets on a full page reload.

## How the demo layer works

- [frontend/src/lib/demoData.ts](frontend/src/lib/demoData.ts) seeds 4 users, 6 papers, 2 chat sessions, 2 completed quizzes, and exposes a small API (`login`, `listPapers`, `sendMessage`, `generateQuiz`, …).
- [frontend/src/lib/api.ts](frontend/src/lib/api.ts) overrides the axios `adapter` so every `api.get/post/delete` call is routed to `demoData` instead of going over the network. Pages don't know the difference.

## Re-enabling the backend later

To go back to a live FastAPI backend:

1. Restore the `baseURL` in [frontend/src/lib/api.ts](frontend/src/lib/api.ts) to `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"` and remove the `api.defaults.adapter = ...` block (drop the `demoData` import).
2. Set `frontend/.env`: `VITE_API_BASE_URL=http://localhost:8000`.
3. Start the backend — see [backend/](backend/) for the FastAPI app, its `requirements.txt`, and `.env.example` (needs `OPENAI_API_KEY` and a `JWT_SECRET`).

Page components require no changes.

## Possible Future Work

Intentionally scoped out of the MVP:

- ML-driven trend analysis (repeated-question detection, topic-weightage prediction across uploaded papers)
- Performance analytics (score progression, weak topics)
- Streaming AI responses (Server-Sent Events) for a typewriter effect
- PDF text extraction so the AI sees paper contents directly (currently metadata only)
- Cloud storage (S3) for PDFs
- Email verification + password reset

## License

Academic / educational use.
