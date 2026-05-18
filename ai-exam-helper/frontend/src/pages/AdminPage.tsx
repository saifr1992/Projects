import { Loader2, ShieldCheck, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../lib/api";
import type { User } from "../lib/types";

type Stats = {
  users: number;
  students: number;
  papers: number;
  quizzes: number;
};

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        api.get<User[]>("/api/admin/users"),
        api.get<Stats>("/api/admin/stats"),
      ]);
      setUsers(u.data);
      setStats(s.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(user: User) {
    if (!confirm(`Delete user ${user.email}?`)) return;
    await api.delete(`/api/admin/users/${user.id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Admin panel</h1>
          <p className="text-sm text-slate-500">Manage users and view system stats.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Total users" value={stats.users} />
              <StatCard label="Students" value={stats.students} />
              <StatCard label="Past papers" value={stats.papers} />
              <StatCard label="Quizzes" value={stats.quizzes} />
            </div>
          )}

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <h2 className="font-semibold">Users</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5">Name</th>
                    <th className="px-5 py-2.5">Email</th>
                    <th className="px-5 py-2.5">Role</th>
                    <th className="px-5 py-2.5">Joined</th>
                    <th className="px-5 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                      <td className="px-5 py-3 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3">
                        {u.role === "admin" ? (
                          <span className="badge-brand">admin</span>
                        ) : (
                          <span className="badge">student</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="btn-ghost px-2 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
