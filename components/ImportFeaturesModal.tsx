"use client";

import { useMemo, useState } from "react";

type ImportResult = {
  inserted?: number;
  updated?: number;
  notFound?: number;
  skippedDuplicates?: number;
  skippedEmpty: number;
  errors?: Array<{ row: number; reason: string }>;
  mode?: "import" | "updateReleaseTypes";
};

export default function ImportFeaturesModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [updateReleaseTypesOnly, setUpdateReleaseTypesOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const hasErrors = useMemo(() => (result?.errors?.length ?? 0) > 0, [result]);

  if (!open) return null;

  const submit = async () => {
    if (!file) {
      setError("Please select a .xlsx or .csv file.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("updateReleaseTypesOnly", String(updateReleaseTypesOnly));
      const res = await fetch("/api/features/import", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as ImportResult | { error: string };
      if (!res.ok) throw new Error("error" in data ? data.error : "Import failed");
      setResult(data as ImportResult);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Import Features</h3>
            <p className="text-sm text-slate-600">
              Upload `.xlsx` or `.csv` with columns: dev, QA, date, feature, vertical. BRD link can be in a separate column or embedded in feature text (e.g. DNP handling [https://...]).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={updateReleaseTypesOnly}
              onChange={(e) => setUpdateReleaseTypesOnly(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Update release types only (match by feature name, no new records)</span>
          </label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />
            <div className="mt-2 text-xs text-slate-500">
              Supports date column or section headers (e.g. &quot;Date : 30/01/2026&quot;). Empty rows ignored. Duplicates skipped.
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex flex-wrap gap-4 text-sm">
                {result.mode === "updateReleaseTypes" ? (
                  <>
                    <span className="text-slate-700">
                      <span className="font-semibold text-slate-900">{result.updated ?? 0}</span> updated
                    </span>
                    <span className="text-slate-700">
                      <span className="font-semibold text-slate-900">{result.notFound ?? 0}</span> not found
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-700">
                      <span className="font-semibold text-slate-900">{result.inserted ?? 0}</span> inserted
                    </span>
                    <span className="text-slate-700">
                      <span className="font-semibold text-slate-900">{result.skippedDuplicates ?? 0}</span> duplicates skipped
                    </span>
                  </>
                )}
                <span className="text-slate-700">
                  <span className="font-semibold text-slate-900">{result.skippedEmpty}</span> empty rows skipped
                </span>
              </div>

              {hasErrors && result.errors && (
                <div className="max-h-48 overflow-auto rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <div className="mb-2 font-semibold">Row errors</div>
                  <ul className="space-y-1">
                    {result.errors.map((er, idx) => (
                      <li key={`${er.row}-${idx}`}>
                        <span className="font-semibold">Row {er.row}:</span> {er.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="h-8 rounded bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

