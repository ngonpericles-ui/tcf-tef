export default function AdminNotificationsLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-700 rounded"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
