"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Vertical, FeatureStatus, ReleaseType, User } from "@/lib/types";
import { calcSuccessRate } from "@/lib/utils";

const verticals: Vertical[] = ["Sales", "Operations", "Finance", "Marketing"];
const statuses: FeatureStatus[] = [
  "Pending BRD",
  "In Development",
  "Testing",
  "Ready for UAT",
  "Released",
  "Scope Changed",
];
const releaseTypes: ReleaseType[] = ["NORMAL_RELEASE", "HOT_FIX"];

export default function EditFeaturePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [developers, setDevelopers] = useState<User[]>([]);
  const [qaUsers, setQaUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    feature_name: "",
    vertical: "Sales" as Vertical,
    stakeholder_name: "",
    brd_link: "",
    feature_description: "",
    developer_name: "",
    qa_name: "",
    request_date: "",
    brd_shared_date: "",
    development_start_date: "",
    release_date: "",
    release_version: "",
    scope_changed_after_release: false,
    feedback_notes: "",
    usage_score: "",
    status: "Pending BRD" as FeatureStatus,
    bugs_found: "",
    bug_count_after_release: "",
    release_type: "NORMAL_RELEASE" as ReleaseType,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/features/${id}`).then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([feature, users]) => {
      if (feature.error) {
        setError(feature.error);
        setLoading(false);
        return;
      }
      setForm({
        feature_name: feature.feature_name || "",
        vertical: feature.vertical || "Sales",
        stakeholder_name: feature.stakeholder_name || "",
        brd_link: feature.brd_link || "",
        feature_description: feature.feature_description || "",
        developer_name: feature.developer_name || "",
        qa_name: feature.qa_name || "",
        request_date: feature.request_date || "",
        brd_shared_date: feature.brd_shared_date || "",
        development_start_date: feature.development_start_date || "",
        release_date: feature.release_date || "",
        release_version: feature.release_version || "",
        scope_changed_after_release: Boolean(feature.scope_changed_after_release),
        feedback_notes: feature.feedback_notes || "",
        usage_score: feature.usage_score != null ? String(feature.usage_score) : "",
        status: feature.status || "Pending BRD",
        bugs_found: feature.bugs_found != null ? String(feature.bugs_found) : "",
        bug_count_after_release: feature.bug_count_after_release != null ? String(feature.bug_count_after_release) : "",
        release_type: (feature.release_type || "NORMAL_RELEASE") as ReleaseType,
      });
      const u = Array.isArray(users) ? users : [];
      setDevelopers(u.filter((x: User) => x.role === "Developer"));
      setQaUsers(u.filter((x: User) => x.role === "QA"));
      setLoading(false);
    });
  }, [id]);

  const update = (k: keyof typeof form, v: string | boolean) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const calculatedSuccessRate = calcSuccessRate(
    form.bug_count_after_release ? parseInt(form.bug_count_after_release, 10) : 0,
    form.scope_changed_after_release
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/features/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature_name: form.feature_name,
          vertical: form.vertical,
          stakeholder_name: form.stakeholder_name,
          brd_link: form.brd_link || undefined,
          feature_description: form.feature_description || undefined,
          developer_name: form.developer_name || undefined,
          qa_name: form.qa_name || undefined,
          request_date: form.request_date || undefined,
          brd_shared_date: form.brd_shared_date || undefined,
          development_start_date: form.development_start_date || undefined,
          release_date: form.release_date || undefined,
          release_version: form.release_version || undefined,
          scope_changed_after_release: form.scope_changed_after_release,
          feedback_notes: form.feedback_notes || undefined,
          usage_score: form.usage_score ? parseInt(form.usage_score, 10) : undefined,
          success_rate: calculatedSuccessRate ?? undefined,
          status: form.status,
          release_type: form.release_type,
          bugs_found: form.bugs_found ? parseInt(form.bugs_found, 10) : undefined,
          bug_count_after_release: form.bug_count_after_release ? parseInt(form.bug_count_after_release, 10) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      router.push(`/features/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.push(`/features/${id}`)}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Back to Feature
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Edit Feature</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Feature Name *</label>
            <input
              type="text"
              required
              value={form.feature_name}
              onChange={(e) => update("feature_name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Vertical *</label>
            <select
              value={form.vertical}
              onChange={(e) => update("vertical", e.target.value as Vertical)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              {verticals.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Stakeholder *</label>
            <input
              type="text"
              required
              value={form.stakeholder_name}
              onChange={(e) => update("stakeholder_name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">BRD Link</label>
            <input
              type="url"
              value={form.brd_link}
              onChange={(e) => update("brd_link", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={form.feature_description}
              onChange={(e) => update("feature_description", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Developer</label>
            <select
              value={form.developer_name}
              onChange={(e) => update("developer_name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              <option value="">—</option>
              {developers.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">QA</label>
            <select
              value={form.qa_name}
              onChange={(e) => update("qa_name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              <option value="">—</option>
              {qaUsers.map((q) => (
                <option key={q.id} value={q.name}>{q.name}</option>
              ))}
            </select>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Request Date</label>
            <input type="date" value={form.request_date} onChange={(e) => update("request_date", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">BRD Shared</label>
            <input type="date" value={form.brd_shared_date} onChange={(e) => update("brd_shared_date", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Dev Start</label>
            <input type="date" value={form.development_start_date} onChange={(e) => update("development_start_date", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Release Date</label>
            <input type="date" value={form.release_date} onChange={(e) => update("release_date", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Release Version</label>
            <input type="text" value={form.release_version} onChange={(e) => update("release_version", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select value={form.status} onChange={(e) => update("status", e.target.value as FeatureStatus)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Release Type</label>
            <select value={form.release_type} onChange={(e) => update("release_type", e.target.value as ReleaseType)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">
              {releaseTypes.map((t) => (
                <option key={t} value={t}>{t === "HOT_FIX" ? "Hot Fix" : "Normal Release"}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bug Count After Release</label>
            <input type="number" min={0} value={form.bug_count_after_release} onChange={(e) => update("bug_count_after_release", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bugs Found (Pre-release)</label>
            <input type="number" min={0} value={form.bugs_found} onChange={(e) => update("bugs_found", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Usage Score (0-100)</label>
            <input type="number" min={0} max={100} value={form.usage_score} onChange={(e) => update("usage_score", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Success Rate (auto)</label>
            <input type="text" readOnly value={calculatedSuccessRate != null ? `${calculatedSuccessRate}%` : "—"} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600" />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" id="scope" checked={form.scope_changed_after_release} onChange={(e) => update("scope_changed_after_release", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            <label htmlFor="scope" className="text-sm font-medium text-slate-700">Scope changed after release</label>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Feedback Notes</label>
            <textarea rows={2} value={form.feedback_notes} onChange={(e) => update("feedback_notes", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={submitting} className="rounded-lg bg-slate-900 px-6 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-50">Save Changes</button>
          <button type="button" onClick={() => router.push(`/features/${id}`)} className="rounded-lg border border-slate-300 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
