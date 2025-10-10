export default function AdminSettingsLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="h-96 bg-slate-700 rounded"></div>
          </div>
          <div className="lg:col-span-3">
            <div className="h-96 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
