import { FileText, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { ChatSession, Paper, QuizHistoryItem } from "../lib/types";

export function DashboardPage() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [quizzes, setQuizzes] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Paper[]>("/api/papers"),
      api.get<ChatSession[]>("/api/chat/sessions"),
      api.get<QuizHistoryItem[]>("/api/quiz"),
    ])
      .then(([p, s, q]) => {
        setPapers(p.data.slice(0, 5));
        setSessions(s.data.slice(0, 5));
        setQuizzes(q.data.slice(0, 5));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const avgScore =
    quizzes.filter((q) => q.submitted && q.score !== null).reduce((acc, q) => acc + (q.score || 0), 0) /
    Math.max(quizzes.filter((q) => q.submitted).length, 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back, {user?.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick up where you left off, or start a new study session.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Past Papers" value={loading ? "…" : papers.length} icon={FileText} />
        <StatCard label="Chat Sessions" value={loading ? "…" : sessions.length} icon={MessageSquare} />
        <StatCard label="Quizzes Taken" value={loading ? "…" : quizzes.filter((q) => q.submitted).length} icon={Sparkles} />
        <StatCard
          label="Avg. Score"
          value={loading ? "…" : quizzes.filter((q) => q.submitted).length ? `${avgScore.toFixed(0)}%` : "—"}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ActionCard
          to="/papers"
          icon={<FileText className="h-5 w-5" />}
          title="Browse past papers"
          description="Search 5 years of exams by subject, year, or keyword."
        />
        <ActionCard
          to="/chat"
          icon={<MessageSquare className="h-5 w-5" />}
          title="Ask the AI tutor"
          description="Get step-by-step concept explanations and answers."
        />
        <ActionCard
          to="/quiz"
          icon={<Sparkles className="h-5 w-5" />}
          title="Generate a quiz"
          description="Auto-generated MCQs from any topic or past paper."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent papers</h2>
            <Link to="/papers" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {papers.length === 0 ? (
            <p className="text-sm text-slate-500">No papers uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {papers.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{p.title}</div>
                    <div className="text-xs text-slate-500">
                      {p.subject} · {p.year}
                    </div>
                  </div>
                  <span className="badge-brand shrink-0">{p.year}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent quizzes</h2>
            <Link to="/quiz" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {quizzes.length === 0 ? (
            <p className="text-sm text-slate-500">No quizzes taken yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {quizzes.map((q) => (
                <li key={q.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {q.topic || `Quiz #${q.id}`}
                    </div>
                    <div className="text-xs text-slate-500">{q.total} questions</div>
                  </div>
                  {q.submitted ? (
                    <span className="badge-green">{q.score?.toFixed(0)}%</span>
                  ) : (
                    <span className="badge">In progress</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ActionCard({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="card group block p-5 transition-all hover:border-brand-300 hover:shadow-md">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-100">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Link>
  );
}
