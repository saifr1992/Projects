import { CheckCircle2, Loader2, Sparkles, Trophy, XCircle } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { api, extractError } from "../lib/api";
import { cn } from "../lib/cn";
import type { Paper, Quiz, QuizHistoryItem, QuizSubmission } from "../lib/types";

type View = "form" | "active" | "result" | "history";

export function QuizPage() {
  const [view, setView] = useState<View>("form");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);

  const [paperId, setPaperId] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizSubmission | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Paper[]>("/api/papers").then((r) => setPapers(r.data));
    api.get<QuizHistoryItem[]>("/api/quiz").then((r) => setHistory(r.data));
  }, []);

  async function refreshHistory() {
    const r = await api.get<QuizHistoryItem[]>("/api/quiz");
    setHistory(r.data);
  }

  async function generate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!paperId && !topic.trim()) {
      setError("Choose a paper or enter a topic");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<Quiz>("/api/quiz/generate", {
        paper_id: paperId === "" ? undefined : paperId,
        topic: topic.trim() || undefined,
        num_questions: numQuestions,
        difficulty,
      });
      setActiveQuiz(res.data);
      setAnswers(new Array(res.data.questions.length).fill(-1));
      setResult(null);
      setView("active");
      refreshHistory();
    } catch (err) {
      setError(extractError(err, "Quiz generation failed"));
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!activeQuiz) return;
    if (answers.some((a) => a < 0)) {
      setError("Please answer every question");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<QuizSubmission>(`/api/quiz/${activeQuiz.id}/submit`, { answers });
      setResult(res.data);
      setView("result");
      refreshHistory();
    } catch (err) {
      setError(extractError(err, "Could not submit quiz"));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setActiveQuiz(null);
    setAnswers([]);
    setResult(null);
    setError(null);
    setView("form");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Quizzes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate AI quizzes from any topic or past paper, then test yourself.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("form")}
            className={cn("btn-secondary", view === "form" && "ring-2 ring-brand-200")}
          >
            New quiz
          </button>
          <button
            onClick={() => setView("history")}
            className={cn("btn-secondary", view === "history" && "ring-2 ring-brand-200")}
          >
            History ({history.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      {view === "form" && (
        <form onSubmit={generate} className="card space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Past paper (optional)</label>
              <select
                value={paperId}
                onChange={(e) => setPaperId(e.target.value === "" ? "" : Number(e.target.value))}
                className="input"
              >
                <option value="">— Pick a paper —</option>
                {papers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.year})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Topic (optional)</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Linked lists, Calculus, OS scheduling"
                className="input"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Number of questions</label>
              <input
                type="number"
                min={3}
                max={15}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="input"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate quiz
          </button>
        </form>
      )}

      {view === "active" && activeQuiz && (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <h2 className="font-semibold">
                {activeQuiz.topic || `Quiz from paper #${activeQuiz.paper_id}`}
              </h2>
              <p className="text-sm text-slate-500">{activeQuiz.total} questions</p>
            </div>
            <span className="badge-brand">In progress</span>
          </div>
          {activeQuiz.questions.map((q, qIdx) => (
            <div key={qIdx} className="card p-5">
              <div className="mb-3 flex items-start gap-2">
                <span className="badge-brand">Q{qIdx + 1}</span>
                <h3 className="font-medium text-slate-900">{q.question}</h3>
              </div>
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                      answers[qIdx] === optIdx
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <input
                      type="radio"
                      name={`q-${qIdx}`}
                      checked={answers[qIdx] === optIdx}
                      onChange={() => {
                        const next = [...answers];
                        next[qIdx] = optIdx;
                        setAnswers(next);
                      }}
                      className="mt-0.5"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="btn-secondary">Cancel</button>
            <button onClick={submit} disabled={loading} className="btn-primary">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Submit quiz
            </button>
          </div>
        </div>
      )}

      {view === "result" && result && (
        <div className="space-y-4">
          <div className="card flex flex-col items-center justify-center gap-2 p-6 text-center">
            <Trophy className="h-10 w-10 text-amber-500" />
            <h2 className="text-2xl font-semibold">{result.score.toFixed(0)}%</h2>
            <p className="text-sm text-slate-500">
              You got {result.correct} out of {result.total} correct.
            </p>
            <div className="mt-3 flex gap-2">
              <button onClick={resetForm} className="btn-primary">Try another quiz</button>
            </div>
          </div>
          {result.results.map((r, i) => (
            <div key={i} className="card p-5">
              <div className="mb-3 flex items-start gap-2">
                <span className={cn("badge", r.is_correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
                  Q{i + 1}
                </span>
                <h3 className="flex-1 font-medium text-slate-900">{r.question}</h3>
                {r.is_correct ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-500" />
                )}
              </div>
              <div className="space-y-2">
                {r.options.map((opt, optIdx) => {
                  const isSelected = r.selected === optIdx;
                  const isCorrect = r.correct_index === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        isCorrect && "border-emerald-300 bg-emerald-50 text-emerald-800",
                        !isCorrect && isSelected && "border-rose-300 bg-rose-50 text-rose-800",
                        !isCorrect && !isSelected && "border-slate-200 text-slate-700",
                      )}
                    >
                      {opt}
                      {isCorrect && <span className="ml-2 text-xs font-medium">(correct)</span>}
                      {!isCorrect && isSelected && <span className="ml-2 text-xs font-medium">(your answer)</span>}
                    </div>
                  );
                })}
              </div>
              {r.explanation && (
                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <strong className="font-medium text-slate-700">Explanation:</strong> {r.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {view === "history" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">No quizzes yet.</p>
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="card flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-slate-900">{h.topic || `Quiz #${h.id}`}</div>
                  <div className="text-xs text-slate-500">
                    {h.total} questions · {new Date(h.created_at).toLocaleString()}
                  </div>
                </div>
                {h.submitted && h.score !== null ? (
                  <span className="badge-green">{h.score.toFixed(0)}%</span>
                ) : (
                  <span className="badge">In progress</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
