export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "var(--bg-secondary)" }} />

      {/* KPI skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl h-28"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl h-16"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
          />
        ))}
      </div>
    </div>
  )
}
