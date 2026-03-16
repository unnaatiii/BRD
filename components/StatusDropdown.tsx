"use client";

import { useState, useRef, useEffect } from "react";
import type { FeatureStatus } from "@/lib/types";

const statuses: FeatureStatus[] = [
  "Pending BRD",
  "In Development",
  "Testing",
  "Ready for UAT",
  "Released",
  "Scope Changed",
];

const statusStyles: Record<FeatureStatus, string> = {
  "Pending BRD": "bg-amber-100 text-amber-800 border-amber-300",
  "In Development": "bg-blue-100 text-blue-800 border-blue-300",
  Testing: "bg-purple-100 text-purple-800 border-purple-300",
  "Ready for UAT": "bg-cyan-100 text-cyan-800 border-cyan-300",
  Released: "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Scope Changed": "bg-orange-100 text-orange-800 border-orange-300",
};

interface StatusDropdownProps {
  featureId: number;
  currentStatus: FeatureStatus;
  onStatusChange: (featureId: number, newStatus: FeatureStatus) => void;
}

export default function StatusDropdown({
  featureId,
  currentStatus,
  onStatusChange,
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (newStatus: FeatureStatus) => {
    if (newStatus === currentStatus) {
      setOpen(false);
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/features/${featureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      onStatusChange(featureId, newStatus);
      setOpen(false);
    } catch {
      // Could add toast/error feedback here
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        disabled={updating}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${
          statusStyles[currentStatus] ?? "bg-slate-100 text-slate-800 border-slate-300"
        } ${updating ? "opacity-60" : "hover:brightness-95"}`}
      >
        {updating ? "Updating…" : currentStatus}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
            Available Stages
          </div>
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelect(s)}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                s === currentStatus
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span
                className={`mr-2 inline-block h-2 w-2 rounded-full ${
                  s === "Pending BRD"
                    ? "bg-amber-500"
                    : s === "In Development"
                    ? "bg-blue-500"
                    : s === "Testing"
                    ? "bg-purple-500"
                    : s === "Ready for UAT"
                    ? "bg-cyan-500"
                    : s === "Released"
                    ? "bg-emerald-500"
                    : "bg-orange-500"
                }`}
              />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
