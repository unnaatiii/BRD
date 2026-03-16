import { getFeatureById } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";
import ReleaseTypeBadge from "@/components/ReleaseTypeBadge";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feature = getFeatureById(parseInt(id, 10));
  if (!feature) notFound();

  const timeline = [
    { label: "Request Date", date: feature.request_date },
    { label: "BRD Shared Date", date: feature.brd_shared_date },
    { label: "Development Start", date: feature.development_start_date },
    { label: "Release Date", date: feature.release_date },
  ].filter((t) => t.date);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/features"
            className="mb-4 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Features
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{feature.feature_name}</h1>
            <Link
              href={`/features/${id}/edit`}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Edit
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusBadge status={feature.status} />
            <ReleaseTypeBadge releaseType={feature.release_type || "NORMAL_RELEASE"} />
            <span className="text-sm text-slate-600">{feature.vertical}</span>
            {feature.release_version && (
              <span className="text-sm text-slate-500">v{feature.release_version}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Description</h3>
          <p className="text-slate-600">
            {feature.feature_description || "No description provided."}
          </p>
          {feature.brd_link && (
            <a
              href={feature.brd_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View BRD →
            </a>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Timeline</h3>
          <ul className="space-y-2">
            {timeline.length === 0 ? (
              <li className="text-slate-500">No timeline data</li>
            ) : (
              timeline.map((t) => (
                <li key={t.label} className="flex justify-between text-sm">
                  <span className="text-slate-600">{t.label}</span>
                  <span className="font-medium text-slate-900">{t.date}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Team</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-slate-500">Stakeholder</span>
              <p className="font-medium text-slate-900">{feature.stakeholder_name}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Developer</span>
              <p className="font-medium text-slate-900">{feature.developer_name || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">QA</span>
              <p className="font-medium text-slate-900">{feature.qa_name || "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Metrics</h3>
          <div className="flex flex-wrap gap-6">
            {feature.usage_score != null && (
              <div>
                <span className="text-sm text-slate-500">Usage Score</span>
                <p className="text-lg font-semibold text-slate-900">{feature.usage_score}</p>
              </div>
            )}
            {feature.success_rate != null && (
              <div>
                <span className="text-sm text-slate-500">Success Rate</span>
                <p className="text-lg font-semibold text-emerald-600">{feature.success_rate}%</p>
              </div>
            )}
            {feature.bug_count_after_release != null && (
              <div>
                <span className="text-sm text-slate-500">Bugs After Release</span>
                <p className="text-lg font-semibold text-red-600">{feature.bug_count_after_release}</p>
              </div>
            )}
            {feature.scope_changed_after_release && (
              <div>
                <span className="text-sm text-slate-500">Scope Changed</span>
                <p className="text-sm font-medium text-amber-600">Yes</p>
              </div>
            )}
            {feature.lead_time != null && (
              <div>
                <span className="text-sm text-slate-500">Lead Time</span>
                <p className="text-lg font-semibold text-slate-900">{feature.lead_time} days</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {feature.feedback_notes && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Feedback Notes</h3>
          <p className="text-slate-600">{feature.feedback_notes}</p>
        </div>
      )}
    </div>
  );
}
