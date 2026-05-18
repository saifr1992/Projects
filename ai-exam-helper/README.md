# AI Exam Helper

An AI-powered web application that helps university students prepare for exams. Students can browse and download past papers, chat with an AI tutor (ChatGPT) about concepts, and generate auto-graded MCQ quizzes from any topic or past paper.

This is a Final Year Project (FYP) implementation.

## Features

- **Authentication** — Student signup/login + seeded Admin account, JWT-based sessions
- **Past Papers** — Admin uploads PDF papers with subject/year/semester metadata; students search, filter, view, and download
- **AI Tutor** — Persistent chat sessions powered by OpenAI's GPT-4o-mini, with optional past-paper grounding
- **Quiz Generation** — AI-generated multiple-choice quizzes from any topic or past paper, auto-scored with explanations
- **Dashboard** — Recent papers, chat sessions, quizzes, and average-score widget
- **Admin Panel** — User management, system stats, paper moderation

## Tech Stack

**Backend**
- Python 3.10+
- FastAPI + Pydantic v2
- SQLAlchemy 2.0 (SQLite for dev, PostgreSQL-ready via `DATABASE_URL`)
- JWT (PyJWT) + bcrypt password hashing
- OpenAI Python SDK

**Frontend**
- React 18 + TypeScript
- Vite 5
- Tailwind CSS + custom component primitives
- React Router 6
- Axios
- Lucide icons
- React Markdown (with GFM) for rendering AI responses

## Project Structure

```
FYP/
├── backend/
│   ├── app/
│   │   ├── core/        # config, database, security
│   │   ├── models/      # SQLAlchemy ORM models
│   │   ├── schemas/     # Pydantic request/response schemas
│   │   ├── routers/     # FastAPI routes (auth, papers, chat, quiz, admin)
│   │   ├── services/    # OpenAI integration
│   │   └── main.py      # FastAPI app + CORS + startup seed
│   ├── uploads/         # PDF uploads stored locally
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/  # Layout, ProtectedRoute
    │   ├── context/     # AuthContext
    │   ├── lib/         # api client, types, cn helper
    │   ├── pages/       # Login, Signup, Dashboard, Papers, Chat, Quiz, Admin
    │   ├── App.tsx
    │   └── main.tsx
    ├── tailwind.config.js
    └── package.json
```

## Setup

### Prerequisites
- Python 3.10+
- Node.js 20+
- An OpenAI API key (https://platform.openai.com/api-keys)

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set OPENAI_API_KEY and (optionally) JWT_SECRET, ADMIN_EMAIL, etc.

# Run the API
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000 and interactive docs at http://localhost:8000/docs.

On first run the app creates `exam_helper.db` (SQLite) and seeds an admin account using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (defaults to `admin@examhelper.com` / `Admin@12345`).

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional — defaults to http://localhost:8000)
cp .env.example .env

# Run the dev server
npm run dev
```

Open http://localhost:5173 in your browser.

### 3. Using the App

1. **Log in as admin** with the credentials from `backend/.env` to upload past papers.
2. **Sign up as a student** (or use a different account) to browse, chat, and take quizzes.
3. Upload at least one PDF paper to get the full experience (chat with paper context, quiz from paper).

## Switching to PostgreSQL

Edit `backend/.env`:

```
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/exam_helper
```

Install the driver: `pip install psycopg2-binary`.
The app calls `Base.metadata.create_all(...)` on startup, so tables are auto-created.

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | — | Create a student account |
| POST | `/api/auth/login` | — | Get a JWT token |
| GET | `/api/auth/me` | user | Current user |
| GET | `/api/papers` | user | List/search/filter papers |
| POST | `/api/papers` | admin | Upload a PDF paper |
| GET | `/api/papers/{id}/download` | user | Download paper PDF |
| DELETE | `/api/papers/{id}` | admin | Remove a paper |
| GET | `/api/chat/sessions` | user | List chat sessions |
| GET | `/api/chat/sessions/{id}` | user | Get a session with messages |
| POST | `/api/chat/send` | user | Send a message; AI replies |
| POST | `/api/quiz/generate` | user | Generate a new quiz |
| POST | `/api/quiz/{id}/submit` | user | Submit answers and get scored |
| GET | `/api/quiz` | user | Quiz history |
| GET | `/api/admin/users` | admin | List all users |
| GET | `/api/admin/stats` | admin | System counts |

Full OpenAPI docs at `/docs` when the backend is running.

## Possible Future Work

These were intentionally scoped out of the MVP — easy to add later:

- ML-driven trend analysis (Pandas/NumPy/TensorFlow): repeated-question detection and topic-weightage prediction across uploaded papers
- Performance analytics (score progression, weak topics)
- Streaming AI responses (Server-Sent Events) for a typewriter effect
- PDF text extraction so the AI sees paper contents directly (currently uses metadata only)
- Cloud storage (S3) for PDFs
- Email verification + password reset

## License

Academic / educational use.
