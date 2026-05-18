# AI Exam Helper — Project Conventions

FastAPI + SQLAlchemy backend, React 18 + TypeScript + Vite frontend. This is a Final Year Project — keep changes minimal, no premature abstractions.

## Commands

```bash
# Backend (port 8000)
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000     # dev
python -m compileall -q app                   # quick syntax check

# Frontend (port 5173)
cd frontend
npm run dev      # vite dev server
npm run build    # tsc -b && vite build (run before claiming "done")
npm run lint     # eslint
```

## Env setup

- `backend/.env` MUST set `JWT_SECRET` (anything but `"change-me"`) and `OPENAI_API_KEY`. The startup guard in `app/main.py` refuses to boot otherwise.
- `frontend/.env` is optional — defaults to `http://localhost:8000`.
- Seeded admin for testing: `admin@examhelper.com` / `Admin@12345` (override via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`).

## Backend (`backend/app/`)

### OpenAI calls — non-negotiable
- **Always call `enforce_ai_quota(user.id)` before any OpenAI request.** Wired in [routers/chat.py](backend/app/routers/chat.py) and [routers/quiz.py](backend/app/routers/quiz.py). Skipping it lets a single user drain the shared API key.
- Pass `max_tokens=settings.OPENAI_MAX_TOKENS` on every `client.chat.completions.create(...)`.
- Untrusted text (paper metadata, user `topic`) goes in a **user-role** message, never appended to `SYSTEM_PROMPT`. Length-cap before injecting.
- Catch broad exceptions, log server-side via `logger.exception`, return generic `502 "AI service temporarily unavailable"` — never leak the raw exception string.

### Auth
- `JWT_SECRET` startup guard in [app/main.py](backend/app/main.py) refuses to boot if it's `""` or `"change-me"`. Don't weaken it.
- Per-user resource scoping: every `db.query(Chat...|Quiz)` MUST include `filter(<Model>.user_id == user.id)`. Admin-only routes use `Depends(require_admin)`.

### Schemas
- Prefer `Literal["a","b","c"]` over `str` for enum-like fields (see `QuizGenerateRequest.difficulty`).
- Always set `max_length` on free-text string fields that get fed to the LLM.

### File uploads
- PDF uploads must pass both the extension check **and** the `%PDF-` magic-byte check ([routers/papers.py](backend/app/routers/papers.py)).
- Stored filenames are UUIDs — don't trust `file.filename` as a path.

## Frontend (`frontend/src/`)

- Tailwind + `cn()` helper from `lib/cn.ts`. No CSS modules, no styled-components.
- API client is `lib/api.ts` (axios). Don't `fetch()` directly in pages.
- Pages live in `src/pages/`, one file per route. Shared layout lives in `components/Layout.tsx`.
- Markdown rendering goes through `react-markdown` + `remark-gfm`. Never use `dangerouslySetInnerHTML`.
- Token is in `localStorage` (known MVP tradeoff). Don't move it without coordinating with `AuthContext`.

## Things this repo intentionally does NOT have

Don't add these on a whim — they were scoped out:
- A test suite (no pytest, no Vitest).
- CI / GitHub Actions.
- Prettier (ESLint only).
- Streaming AI responses (SSE).
- PDF text extraction — the AI sees metadata, not contents.

## Demo / submission readiness

Before each supervisor checkpoint, dispatch the `fyp-demo-checker` agent. Before any auth/upload/OpenAI change ships, dispatch `security-reviewer`.

## Local automation

`.claude/` contains: a PreToolUse hook that blocks edits to `.env` / `.db` / `uploads/`, a PostToolUse hook that runs `eslint --fix` on frontend edits, the two subagents above, and a user-only `seed-test-data` skill for demo prep. Hooks load on Claude Code startup — restart if you add new ones.
