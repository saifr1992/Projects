import { Loader2, MessageSquarePlus, Send, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api, extractError } from "../lib/api";
import { cn } from "../lib/cn";
import type { ChatMessage, ChatSession, ChatSessionDetail, Paper } from "../lib/types";

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [paperId, setPaperId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.get<ChatSession[]>("/api/chat/sessions").then((r) => setSessions(r.data));
    api.get<Paper[]>("/api/papers").then((r) => setPapers(r.data));
  }, []);

  useEffect(() => {
    if (activeId === null) {
      setMessages([]);
      return;
    }
    api.get<ChatSessionDetail>(`/api/chat/sessions/${activeId}`).then((r) => setMessages(r.data.messages));
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setError(null);
    setSending(true);

    const optimistic: ChatMessage = {
      id: -Date.now(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await api.post("/api/chat/send", {
        content,
        session_id: activeId ?? undefined,
        paper_id: paperId === "" ? undefined : paperId,
      });
      const newSessionId = res.data.session_id;
      if (activeId !== newSessionId) {
        const sessionsRes = await api.get<ChatSession[]>("/api/chat/sessions");
        setSessions(sessionsRes.data);
        setActiveId(newSessionId);
      }
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        res.data.user_message,
        res.data.assistant_message,
      ]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(extractError(err, "Could not send message"));
    } finally {
      setSending(false);
    }
  }

  async function startNewChat() {
    setActiveId(null);
    setMessages([]);
    setPaperId("");
  }

  async function deleteSession(id: number) {
    if (!confirm("Delete this chat session?")) return;
    await api.delete(`/api/chat/sessions/${id}`);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4 md:h-[calc(100vh-5rem)]">
      <aside className="hidden w-64 shrink-0 flex-col md:flex">
        <button className="btn-primary mb-3" onClick={startNewChat}>
          <MessageSquarePlus className="h-4 w-4" /> New chat
        </button>
        <div className="card flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-slate-500">No chats yet.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                  activeId === s.id ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <button onClick={() => setActiveId(s.id)} className="flex-1 truncate text-left">
                  {s.title}
                </button>
                <button
                  onClick={() => deleteSession(s.id)}
                  className="invisible rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 group-hover:visible"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <section className="card flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="font-semibold text-slate-900">AI Tutor</h2>
            <p className="text-xs text-slate-500">
              Ask anything about your subjects, concepts, or past paper questions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Paper context:</label>
            <select
              value={paperId}
              onChange={(e) => setPaperId(e.target.value === "" ? "" : Number(e.target.value))}
              className="input w-48"
            >
              <option value="">None</option>
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.year})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
          {messages.length === 0 && !sending && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <MessageSquarePlus className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-900">Start a conversation</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Try "Explain the concept of dynamic programming with an example" or paste a past paper question.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
              {m.role !== "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  AI
                </div>
              )}
              <div
                className={cn(
                  "max-w-3xl rounded-xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 bg-white text-slate-800",
                )}
              >
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                AI
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-100 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            className="input flex-1"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !input.trim()} className="btn-primary">
            <Send className="h-4 w-4" />
            <span className="hidden md:inline">Send</span>
          </button>
        </form>
      </section>
    </div>
  );
}
