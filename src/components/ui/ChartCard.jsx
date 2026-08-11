export default function ChartCard({ title, action, children, className = "" }) {
  return (
    <div
      className={`bg-white border border-slate-300 rounded-card p-6 shadow-card transition-all duration-200 ease-out hover:shadow-elevated hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-[15px] font-bold text-slate-900">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}