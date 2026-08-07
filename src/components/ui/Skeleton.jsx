/** Khối skeleton cơ bản — nền xám nhấp nháy (pulse) */
export function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

/** Skeleton cho trang Dashboard: 4 stat card + vùng biểu đồ */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="w-9 h-9 rounded-lg" />
              <SkeletonBlock className="w-12 h-3" />
            </div>
            <SkeletonBlock className="w-16 h-6" />
            <SkeletonBlock className="w-24 h-3" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
          <SkeletonBlock className="w-40 h-4" />
          <SkeletonBlock className="w-full h-52" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
          <SkeletonBlock className="w-32 h-4" />
          <SkeletonBlock className="w-full h-52 rounded-full mx-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
          <SkeletonBlock className="w-32 h-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="w-full h-8" />
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
          <SkeletonBlock className="w-32 h-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="w-3/4 h-3" />
                <SkeletonBlock className="w-1/2 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton cho bảng danh sách lead */
export function LeadListSkeleton({ rows = 6 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {Array.from({ length: 9 }).map((_, i) => (
                <th key={i} className="py-3 px-4">
                  <SkeletonBlock className="w-16 h-3" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-slate-100">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className="w-7 h-7 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <SkeletonBlock className="w-24 h-3" />
                      <SkeletonBlock className="w-32 h-2.5" />
                    </div>
                  </div>
                </td>
                {Array.from({ length: 8 }).map((_, c) => (
                  <td key={c} className="py-3 px-4">
                    <SkeletonBlock className="w-16 h-3" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Skeleton cho trang Chi tiết lead */
export function LeadDetailSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="w-40 h-4" />
      <SkeletonBlock className="w-32 h-5" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonBlock className="w-32 h-3.5" />
                <SkeletonBlock className="w-20 h-4 rounded-full" />
                <SkeletonBlock className="w-40 h-3" />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <SkeletonBlock className="w-16 h-3" />
                  <SkeletonBlock className="w-28 h-3" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-11 h-11 rounded-full shrink-0" />
              <div className="space-y-2">
                <SkeletonBlock className="w-16 h-3" />
                <SkeletonBlock className="w-12 h-6" />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBlock key={i} className="w-full h-3" />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <SkeletonBlock className="w-32 h-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <SkeletonBlock className="w-5 h-5 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonBlock className="w-2/3 h-3" />
                  <SkeletonBlock className="w-1/3 h-2.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}