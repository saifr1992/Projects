import { BookOpen, FileText, LayoutDashboard, LogOut, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/cn";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/papers", label: "Past Papers", icon: FileText },
  { to: "/chat", label: "AI Tutor", icon: MessageSquare },
  { to: "/quiz", label: "Quizzes", icon: Sparkles },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">ExamHelper</div>
            <div className="text-xs text-slate-500">AI study companion</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )
              }
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="mb-2 px-2 text-xs text-slate-500">Signed in as</div>
          <div className="px-2 text-sm font-medium text-slate-900">{user?.name}</div>
          <div className="mb-3 px-2 text-xs text-slate-500">{user?.email}</div>
          <button onClick={handleLogout} className="btn-ghost w-full justify-start">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-semibold">ExamHelper</span>
        </Link>
        <button onClick={handleLogout} className="btn-ghost px-2">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <nav className="sticky top-[57px] z-10 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        {user?.role === "admin" && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600",
              )
            }
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </NavLink>
        )}
      </nav>

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
