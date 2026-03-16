"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import type { Feature } from "@/lib/types";

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/developers")
      .then((r) => r.json())
      .then((d) => {
        setDevelopers(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Developer Performance</h1>
        <p className="text-slate-600">Features developed by each developer</p>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-6">
          {developers.map((name) => (
            <DeveloperCard key={name} name={name} />
          ))}
          {developers.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No developers found
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DeveloperCard({ name }: { name: string }) {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[] | null>(null);

  useEffect(() => {
    fetch(`/api/developers/${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((d) => setFeatures(Array.isArray(d) ? d : []))
      .catch(() => setFeatures([]));
  }, [name]);

  if (!features) return null;

  const released = features.filter((f) => f.status === "Released");
  const scopeChanged = features.filter((f) => f.scope_changed_after_release);
  const withSuccessRate = features.filter((f) => f.success_rate != null);
  const avgSuccessRate =
    withSuccessRate.length > 0
      ? Math.round(
          withSuccessRate.reduce((s, f) => s + (f.success_rate ?? 0), 0) / withSuccessRate.length
        )
      : null;
  const scopeChangePct =
    features.length > 0 ? Math.round((scopeChanged.length / features.length) * 100) : 0;

  const columns = [
    { key: "feature_name", label: "Feature" },
    { key: "vertical", label: "Vertical" },
    { key: "status", label: "Status", render: (r: Feature) => <StatusBadge status={r.status} /> },
    { key: "release_date", label: "Release", render: (r: Feature) => r.release_date ?? "-" },
    {
      key: "success_rate",
      label: "Success %",
      render: (r: Feature) => (r.success_rate != null ? `${r.success_rate}%` : "-"),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
          <div className="mt-2 flex gap-6 text-sm text-slate-600">
            <span>Total features: {features.length}</span>
            <span>Released: {released.length}</span>
            <span>Avg success rate: {avgSuccessRate ?? "-"}%</span>
            <span>Scope change: {scopeChangePct}%</span>
          </div>
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
