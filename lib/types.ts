export type Vertical = "Sales" | "Operations" | "Finance" | "Marketing";

export type FeatureStatus =
  | "Pending BRD"
  | "In Development"
  | "Testing"
  | "Ready for UAT"
  | "Released"
  | "Scope Changed";

export type UserRole = "Developer" | "QA";

export type ReleaseType = "NORMAL_RELEASE" | "HOT_FIX";

export interface Feature {
  id: number;
  feature_name: string;
  vertical: Vertical;
  stakeholder_name: string;
  brd_link: string | null;
  feature_description: string | null;
  request_date: string | null;
  brd_shared_date: string | null;
  development_start_date: string | null;
  release_date: string | null;
  release_version: string | null;
  developer_name: string | null;
  qa_name: string | null;
  reviewer_name: string | null;
  scope_changed_after_release: boolean;
  feedback_notes: string | null;
  usage_score: number | null;
  success_rate: number | null;
  status: FeatureStatus;
  bugs_found: number | null;
  bug_count_after_release: number | null;
  release_type: ReleaseType;
  lead_time: number | null;
}

export interface FeatureInput {
  feature_name: string;
  vertical: Vertical;
  stakeholder_name: string;
  brd_link?: string;
  feature_description?: string;
  request_date?: string;
  brd_shared_date?: string;
  development_start_date?: string;
  release_date?: string;
  release_version?: string;
  developer_name?: string;
  qa_name?: string;
  reviewer_name?: string;
  scope_changed_after_release?: boolean;
  feedback_notes?: string;
  usage_score?: number;
  success_rate?: number;
  status?: FeatureStatus;
  bugs_found?: number;
  bug_count_after_release?: number;
  release_type?: ReleaseType;
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
}
