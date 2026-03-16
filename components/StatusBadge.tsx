import type { FeatureStatus } from "@/lib/types";

const statusColors: Record<FeatureStatus, string> = {
  "Pending BRD": "bg-amber-100 text-amber-800",
  "In Development": "bg-blue-100 text-blue-800",
  Testing: "bg-purple-100 text-purple-800",
  "Ready for UAT": "bg-cyan-100 text-cyan-800",
  Released: "bg-emerald-100 text-emerald-800",
  "Scope Changed": "bg-orange-100 text-orange-800",
};

export default function StatusBadge({ status }: { status: FeatureStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        statusColors[status] ?? "bg-slate-100 text-slate-800"
      }`}
    >
      {status}
    </span>
  );
}
