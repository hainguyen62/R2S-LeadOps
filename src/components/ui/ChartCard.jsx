export default function ChartCard({ title, action, children, className = "" }) {
  return (
    <div
      className={`bg-white border border-slate-300 rounded-card p-6 shadow-card transition-all duration-200 ease-out hover:shadow-elevated hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="min-w-0 flex-1 text-[15px] font-bold text-slate-900 truncate">{title}</div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}