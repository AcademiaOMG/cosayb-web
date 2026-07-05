export default function InventarioLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "var(--bg-secondary)" }} />
      <div className="h-10 w-full rounded-xl animate-pulse" style={{ background: "var(--bg-secondary)" }} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl h-40"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
          />
        ))}
      </div>
    </div>
  )
}
