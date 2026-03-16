"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import MagicLineNav from "@/components/MagicLineNav";
import StatusDropdown from "@/components/StatusDropdown";
import ReleaseTypeBadge from "@/components/ReleaseTypeBadge";
import ImportFeaturesModal from "@/components/ImportFeaturesModal";
import type { Feature, FeatureStatus } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const verticals = ["Sales", "Operations", "Finance", "Marketing"];
const statuses = ["Pending BRD", "In Development", "Testing", "Ready for UAT", "Released", "Scope Changed"];
const PAGE_SIZE = 10;

const filterInputClass = "rounded border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function FeaturesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [users, setUsers] = useState<{ name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [vertical, setVertical] = useState("");
  const [developer, setDeveloper] = useState(searchParams.get("developer") ?? "");
  const [qa, setQA] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [startDate, setStartDate] = useState(searchParams.get("start_date") ?? "");
  const [endDate, setEndDate] = useState(searchParams.get("end_date") ?? "");
  const [scopeChange, setScopeChange] = useState(searchParams.get("scope_change") ?? "");
  const [releaseType, setReleaseType] = useState(searchParams.get("release_type") ?? "");
  const [releaseMonth, setReleaseMonth] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [animatingDeleteId, setAnimatingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setStatus(searchParams.get("status") ?? "");
    setDeveloper(searchParams.get("developer") ?? "");
    setStartDate(searchParams.get("start_date") ?? "");
    setEndDate(searchParams.get("end_date") ?? "");
    setScopeChange(searchParams.get("scope_change") ?? "");
    setReleaseType(searchParams.get("release_type") ?? "");
  }, [searchParams]);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/features").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([fData, uData]) => {
      setFeatures(Array.isArray(fData) ? fData : []);
      setUsers(Array.isArray(uData) ? uData : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const developers = useMemo(() => {
    const fromFeatures = new Set<string>();
    features.forEach((f) => {
      (f.developer_name ?? "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((n) => fromFeatures.add(n));
    });
    users.filter((u) => u.role === "Developer").forEach((u) => fromFeatures.add(u.name));
    return [...fromFeatures].sort();
  }, [features, users]);

  const qaNames = useMemo(() => {
    const fromFeatures = new Set(features.map((f) => f.qa_name).filter(Boolean)) as Set<string>;
    users.filter((u) => u.role === "QA").forEach((u) => fromFeatures.add(u.name));
    return [...fromFeatures].sort();
  }, [features, users]);

  const filtered = useMemo(() => {
    let list = [...features];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.feature_name.toLowerCase().includes(q));
    }
    if (vertical) list = list.filter((f) => f.vertical === vertical);
    if (developer)
      list = list.filter((f) => {
        if (!f.developer_name) return false;
        const parts = f.developer_name.split(",").map((p) => p.trim());
        return parts.includes(developer);
      });
    if (qa) list = list.filter((f) => f.qa_name === qa);
    if (status) list = list.filter((f) => f.status === status);
    if (startDate) list = list.filter((f) => f.release_date && f.release_date >= startDate);
    if (endDate) list = list.filter((f) => f.release_date && f.release_date <= endDate);
    if (scopeChange === "true") list = list.filter((f) => f.scope_changed_after_release === true);
    if (releaseType) list = list.filter((f) => (f.release_type || "NORMAL_RELEASE") === releaseType);
    if (releaseMonth) list = list.filter((f) => f.release_date?.startsWith(releaseMonth));
    if (sortOrder === "newest") {
      list.sort((a, b) => {
        const da = a.request_date || a.release_date || "";
        const db = b.request_date || b.release_date || "";
        return db.localeCompare(da);
      });
    } else {
      list.sort((a, b) => {
        const da = a.request_date || a.release_date || "9999";
        const db = b.request_date || b.release_date || "9999";
        return da.localeCompare(db);
      });
    }
    return list;
  }, [features, search, vertical, developer, qa, status, startDate, endDate, scopeChange, releaseType, releaseMonth, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paginated = useMemo(
    () => filtered.slice(start, start + PAGE_SIZE),
    [filtered, start]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, vertical, developer, qa, status, startDate, endDate, scopeChange, releaseType, releaseMonth, sortOrder]);

  const verticalRowBg: Record<string, string> = {
    Sales: "#e9f7da",
    Operations: "#b4e5fa",
    Finance: "#f1e8ff",
    Marketing: "#fff1e6",
  };

  const verticalColors: Record<string, string> = {
    Sales: "text-green-700 font-medium",
    Operations: "text-blue-700 font-medium",
    Finance: "text-violet-700 font-medium",
    Marketing: "text-amber-700 font-medium",
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/features/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to delete");
      setFeatures((prev) => prev.filter((f) => f.id !== id));
      setAnimatingDeleteId(null);
      setToast({ message: "Feature deleted successfully.", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setAnimatingDeleteId(null);
      setToast({ message: "Failed to delete feature.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDelete = (id: number) => {
    setDeleteConfirmId(null);
    setAnimatingDeleteId(id);
    setTimeout(() => handleDelete(id), 750);
  };

  const handleStatusChange = (featureId: number, newStatus: FeatureStatus) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, status: newStatus } : f))
    );
  };

  const columnConfig = [
    {
      key: "feature_name",
      label: "Feature Name",
      width: 320,
      align: "left" as const,
      render: (r: Feature) => (
        <span className="block break-words whitespace-normal">
          {r.feature_name}
        </span>
      ),
    },
    {
      key: "vertical",
      label: "Vertical",
      width: 120,
      align: "left" as const,
      render: (r: Feature) => <span className={verticalColors[r.vertical] ?? ""}>{r.vertical}</span>,
    },
    { key: "stakeholder_name", label: "Stakeholder", width: 180, align: "left" as const },
    {
      key: "brd_link",
      label: "BRD Link",
      width: 110,
      align: "center" as const,
      render: (r: Feature) =>
        r.brd_link ? (
          <a
            href={r.brd_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-block rounded border border-slate-900 px-1.5 py-0.5 text-xs font-medium text-slate-900 transition-opacity hover:opacity-80"
          >
            Open
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "developer_name",
      label: "Developer",
      width: 160,
      align: "left" as const,
      render: (r: Feature) => {
        const name = r.developer_name;
        if (!name) return "-";
        const url = `/features?developer=${encodeURIComponent(name)}`;
        return (
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="developer-link inline-flex cursor-pointer items-center gap-1 text-slate-900 transition-colors duration-200 ease-out hover:text-red-600 hover:underline"
          >
            {name}
            <svg className="shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      width: 150,
      align: "center" as const,
      render: (r: Feature) => (
        <StatusDropdown
          featureId={r.id}
          currentStatus={r.status}
          onStatusChange={handleStatusChange}
        />
      ),
    },
    { key: "qa_name", label: "QA", width: 120, align: "left" as const, render: (r: Feature) => r.qa_name ?? "-" },
    { key: "brd_shared_date", label: "BRD Date", width: 120, align: "center" as const, render: (r: Feature) => r.brd_shared_date ?? "-" },
    { key: "release_date", label: "Release Date", width: 120, align: "center" as const, render: (r: Feature) => r.release_date ?? "-" },
    {
      key: "release_type",
      label: "Release Type",
      width: 130,
      align: "center" as const,
      render: (r: Feature) => <ReleaseTypeBadge releaseType={r.release_type || "NORMAL_RELEASE"} />,
    },
    { key: "success_rate", label: "Success %", width: 100, align: "center" as const, render: (r: Feature) => r.success_rate != null ? `${r.success_rate}%` : "-" },
    {
      key: "actions",
      label: "",
      width: 110,
      align: "center" as const,
      render: (r: Feature) => (
        <div className="flex shrink-0 items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/features/${r.id}/edit`}
            className="shrink-0 flex h-8 items-center rounded px-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setDeleteConfirmId(r.id)}
            className={`shrink-0 flex h-8 w-8 items-center justify-center rounded text-slate-400 transition-colors hover:text-red-600 ${animatingDeleteId === r.id ? "trash-icon-receiving" : ""}`}
            aria-label="Delete feature"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  const statusNavItems = [
    { label: "All", value: "" },
    ...statuses.map((s) => ({ label: s, value: s })),
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Features</h1>
            <p className="text-sm text-slate-600">All product features and BRDs</p>
          </div>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="h-8 rounded px-3 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800"
          >
            Import Features
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="px-4 pt-3">
          <MagicLineNav
            items={statusNavItems}
            activeValue={status}
            onChange={(v) => setStatus(v)}
          />
        </div>
        <div className="p-4">
        <div className="mb-3 mt-3 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by feature name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={filterInputClass}
          />
          <select value={vertical} onChange={(e) => setVertical(e.target.value)} className={filterInputClass}>
            <option value="">All Verticals</option>
            {verticals.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={developer} onChange={(e) => setDeveloper(e.target.value)} className={filterInputClass}>
            <option value="">All Developers</option>
            {developers.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={qa} onChange={(e) => setQA(e.target.value)} className={filterInputClass}>
            <option value="">All QA</option>
            {qaNames.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
          <select value={releaseType} onChange={(e) => setReleaseType(e.target.value)} className={filterInputClass}>
            <option value="">All Release Types</option>
            <option value="NORMAL_RELEASE">Normal Release</option>
            <option value="HOT_FIX">Hot Fix</option>
          </select>
          <div className="flex gap-2">
            <input type="month" value={releaseMonth} onChange={(e) => setReleaseMonth(e.target.value)} className={filterInputClass} />
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")} className={filterInputClass}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="features-table divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {columnConfig.map((col) => (
                    <th
                      key={String(col.key)}
                      style={{ width: col.width, minWidth: col.width }}
                      className={`text-xs font-semibold uppercase tracking-wider text-slate-600 ${
                        col.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columnConfig.map((col) => (
                      <td key={String(col.key)}>
                        <div className={`h-5 rounded bg-slate-200 ${col.key === "feature_name" ? "max-w-full" : "max-w-24"} w-full`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="features-table divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {columnConfig.map((col) => (
                    <th
                      key={String(col.key)}
                      style={{ width: col.width, minWidth: col.width }}
                      className={`text-xs font-semibold uppercase tracking-wider text-slate-600 ${
                        col.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columnConfig.length} className="py-8 text-center text-slate-500">
                      No features match your filters. Add features via Add Feature.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => {
                    const isDeleting = animatingDeleteId === row.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => !isDeleting && router.push(`/features/${row.id}`)}
                        className={`features-table-row cursor-pointer ${isDeleting ? "features-table-row-deleting" : ""}`}
                        style={{ "--row-hover-color": verticalRowBg[row.vertical] ?? "#e2e8f0" } as React.CSSProperties}
                      >
                        {columnConfig.map((col) => (
                          <td
                            key={String(col.key)}
                            className={`text-sm text-slate-700 ${
                              col.key === "feature_name"
                                ? "features-table-cell-feature"
                                : col.align === "center"
                                ? "features-table-cell-center"
                                : "features-table-cell-left"
                            }`}
                          >
                            {col.render ? col.render(row) : String((row as unknown as Record<string, unknown>)[col.key as string] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2">
          <span className="text-sm text-slate-600">
            {loading
              ? "Loading…"
              : filtered.length === 0
              ? "No features"
              : `${start + 1}-${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} features`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Prev
              </button>
              {(() => {
                const showEllipsis = totalPages > 8;
                let pages: number[];
                if (totalPages <= 7) pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                else if (page <= 4) pages = [1, 2, 3, 4, 5, 6, 7];
                else if (page >= totalPages - 3) pages = Array.from({ length: 7 }, (_, i) => totalPages - 6 + i);
                else pages = [page - 3, page - 2, page - 1, page, page + 1, page + 2, page + 3];
                return (
                  <>
                    {pages.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`min-w-[28px] rounded px-2 py-1 text-sm ${
                          page === p ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    {showEllipsis && !pages.includes(totalPages) && (
                      <>
                        <span className="px-1 text-slate-400">…</span>
                        <button
                          type="button"
                          onClick={() => setPage(totalPages)}
                          className={`min-w-[28px] rounded px-2 py-1 text-sm ${
                            page === totalPages ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </>
                );
              })()}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {deleteConfirmId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => !deleting && setDeleteConfirmId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="mb-6 text-slate-700">Delete this feature?</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !deleting && setDeleteConfirmId(null)}
                disabled={deleting}
                className="h-8 rounded border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteConfirmId != null && handleConfirmDelete(deleteConfirmId)}
                disabled={deleting}
                className="h-8 rounded bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportFeaturesModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refresh}
      />
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <FeaturesContent />
    </Suspense>
  );
}
