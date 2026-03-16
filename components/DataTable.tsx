"use client";

import { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends object>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data",
}: DataTableProps<T>) {
  const getValue = (row: T, key: keyof T | string): unknown => {
    const k = key as keyof T;
    return (row as Record<string, unknown>)[k as string];
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={String(keyExtractor(row))}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${
                  onRowClick ? "cursor-pointer hover:bg-slate-50" : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {col.render ? col.render(row) : String(getValue(row, col.key) ?? "-")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
