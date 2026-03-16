"use client";

import { useEffect, useState } from "react";
import type { User, UserRole } from "@/lib/types";
import MagicLineNav from "@/components/MagicLineNav";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("Developer");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add user");
      setName("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) load();
      else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch {
      alert("Failed to delete");
    }
  };

  const roleNavItems = [
    { label: "All", value: "" },
    { label: "Developers", value: "Developer" },
    { label: "QA", value: "QA" },
  ];

  const filteredUsers = roleFilter
    ? users.filter((u) => u.role === roleFilter)
    : users;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-600">Manage developers and QA</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <MagicLineNav
            items={roleNavItems}
            activeValue={roleFilter}
            onChange={setRoleFilter}
          />
        </div>
        <div className="p-6">
        <h2 className="mb-4 mt-4 font-semibold text-slate-900">Add User</h2>
        <form onSubmit={handleAdd} className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">User Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="min-w-[140px] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Developer">Developer</option>
              <option value="QA">QA</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-5 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add User"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <h2 className="mb-4 font-semibold text-slate-900">List Users</h2>
        {loading ? (
          <p className="py-8 text-center text-slate-500">Loading...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="py-8 text-center text-slate-500">
            {roleFilter ? "No users match this filter." : "No users yet. Add one above."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="text-slate-700">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
