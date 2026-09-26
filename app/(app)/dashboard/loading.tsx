import "./glass.css"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-8 w-56 rounded-lg animate-pulse" style={{ background: "var(--bg-secondary)" }} />

      <div className="glass-grid-wrap glass-grid-wrap-wide">
        <div
          className="animate-pulse"
          style={{ height: 130, borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)" }}
        />
      </div>

      <div className="glass-grid-wrap glass-grid-wrap-wide">
        <div className="glass-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="glass-card-skeleton animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
