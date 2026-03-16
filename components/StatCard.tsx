import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  /** When provided, card is clickable and links to this href with hover/click animations */
  href?: string;
}

const cardContent = (title: string, value: string | number, subtitle?: string) => (
  <>
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className="mt-1.5 text-xl font-bold text-slate-900">{value}</p>
    {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
  </>
);

const cardBase =
  "rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-250 ease-out";

export default function StatCard({ title, value, subtitle, href }: StatCardProps) {
  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`stat-card relative block ${cardBase} transition-all duration-300 ease-out hover:shadow-md active:scale-[0.98] cursor-pointer`}
      >
        {cardContent(title, value, subtitle)}
      </Link>
    );
  }
  return <div className={`stat-card ${cardBase}`}>{cardContent(title, value, subtitle)}</div>;
}
