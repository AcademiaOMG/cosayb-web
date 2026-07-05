export default function RecetasLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "var(--bg-secondary)" }} />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg animate-pulse" style={{ background: "var(--bg-secondary)" }} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl h-48"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
          />
        ))}
      </div>
    </div>
  )
}
