"use client";

import { useRouter } from "next/navigation";
import DataTable from "./DataTable";
import StatusBadge from "./StatusBadge";
import type { Feature } from "@/lib/types";

const recentColumns = [
  { key: "feature_name", label: "Feature" },
  { key: "vertical", label: "Vertical" },
  { key: "release_date", label: "Release", render: (r: Feature) => r.release_date ?? "-" },
  { key: "status", label: "Status", render: (r: Feature) => <StatusBadge status={r.status} /> },
];

const testingColumns = [
  { key: "feature_name", label: "Feature" },
  { key: "developer_name", label: "Developer", render: (r: Feature) => r.developer_name ?? "-" },
  { key: "qa_name", label: "QA", render: (r: Feature) => r.qa_name ?? "-" },
  { key: "status", label: "Status", render: (r: Feature) => <StatusBadge status={r.status} /> },
];

export default function FeatureTableNav({
  data,
  emptyMessage,
  variant = "recent",
}: {
  data: Feature[];
  emptyMessage?: string;
  variant?: "recent" | "testing";
}) {
  const columns = variant === "testing" ? testingColumns : recentColumns;
  const router = useRouter();
  return (
    <DataTable<Feature>
      columns={columns}
      data={data}
      keyExtractor={(r) => r.id}
      onRowClick={(r) => router.push(`/features/${r.id}`)}
      emptyMessage={emptyMessage}
    />
  );
}
