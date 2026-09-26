export default function InventarioLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg animate-pulse" style={{ background: "var(--bg-secondary)" }} />
        <div className="h-10 w-28 animate-pulse" style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-11 w-full animate-pulse" style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }} />
        <div
          className="flex flex-col overflow-hidden animate-pulse"
          style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="h-3.5 rounded-md" style={{ width: `${40 + ((i * 17) % 30)}%`, background: "var(--bg-secondary)" }} />
              <div className="h-3.5 w-16 rounded-md" style={{ background: "var(--bg-secondary)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
