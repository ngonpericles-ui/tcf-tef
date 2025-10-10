export default function AdminSearchLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-700 rounded w-1/3"></div>
        <div className="h-20 bg-slate-700 rounded"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
