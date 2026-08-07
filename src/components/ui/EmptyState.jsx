/**
 * Empty State dùng chung — hiển thị khi danh sách rỗng (chưa có dữ liệu)
 * hoặc không tìm thấy kết quả phù hợp (tìm kiếm/lọc).
 *
 * Dùng: <EmptyState icon={Users} title="Chưa có lead nào" description="..." action={{label:"Thêm lead", onClick}} />
 */
export default function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 px-4" : "py-14 px-6"}`}>
      {Icon && (
        <div
          className={`rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3 ${
            compact ? "w-10 h-10" : "w-14 h-14"
          }`}
        >
          <Icon size={compact ? 18 : 24} />
        </div>
      )}
      <p className={`font-medium text-slate-700 ${compact ? "text-sm" : "text-base"}`}>{title}</p>
      {description && (
        <p className={`text-slate-400 mt-1 max-w-sm ${compact ? "text-xs" : "text-sm"}`}>{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg px-3.5 py-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}