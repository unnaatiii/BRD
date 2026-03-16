import type { ReleaseType } from "@/lib/types";

const styles: Record<ReleaseType, string> = {
  NORMAL_RELEASE: "bg-slate-100 text-slate-700 border-slate-300",
  HOT_FIX: "bg-amber-100 text-amber-800 border-amber-400",
};

export default function ReleaseTypeBadge({ releaseType }: { releaseType: ReleaseType }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
        styles[releaseType] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {releaseType === "HOT_FIX" ? "Hot Fix" : "Normal"}
    </span>
  );
}
