"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import type { Feature } from "@/lib/types";

export default function QAPage() {
  const [qaList, setQaList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/qa")
      .then((r) => r.json())
      .then((d) => {
        setQaList(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QA Performance</h1>
        <p className="text-slate-600">Features tested by each QA engineer</p>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-6">
          {qaList.map((name) => (
            <QACard key={name} name={name} />
          ))}
          {qaList.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No QA engineers found
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function QACard({ name }: { name: string }) {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[] | null>(null);

  useEffect(() => {
    fetch(`/api/qa/${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((d) => setFeatures(Array.isArray(d) ? d : []))
      .catch(() => setFeatures([]));
  }, [name]);

  if (!features) return null;

  const tested = features.filter((f) => f.status === "Released" || f.status === "Testing");
  const withSuccessRate = features.filter((f) => f.success_rate != null);
  const avgSuccessRate =
    withSuccessRate.length > 0
      ? Math.round(
          withSuccessRate.reduce((s, f) => s + (f.success_rate ?? 0), 0) / withSuccessRate.length
        )
      : null;
  const totalBugs = features.reduce((s, f) => s + (f.bugs_found ?? 0), 0);

  const columns = [
    { key: "feature_name", label: "Feature" },
    { key: "vertical", label: "Vertical" },
    { key: "status", label: "Status", render: (r: Feature) => <StatusBadge status={r.status} /> },
    {
      key: "bugs_found",
      label: "Bugs Found",
      render: (r: Feature) => r.bugs_found ?? "-",
    },
    {
      key: "success_rate",
      label: "Success %",
      render: (r: Feature) => (r.success_rate != null ? `${r.success_rate}%` : "-"),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
        <div className="mt-2 flex gap-6 text-sm text-slate-600">
          <span>Total features tested: {features.length}</span>
          <span>Avg success rate: {avgSuccessRate ?? "-"}%</span>
          <span>Bugs found: {totalBugs}</span>
        </div>
      </div>
      <DataTable<Feature>
        columns={columns}
        data={features}
        keyExtractor={(r) => r.id}
        onRowClick={(r) => router.push(`/features/${r.id}`)}
      />
    </div>
  );
}
