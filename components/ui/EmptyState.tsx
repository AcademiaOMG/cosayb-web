export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-xl px-6 py-16 text-center"
      style={{
        background: "var(--bg-surface)",
        border: "1px dashed var(--border-medium)",
      }}
    >
      {icon && (
        <div style={{ color: "var(--text-muted)", opacity: 0.6 }}>{icon}</div>
      )}
      <div className="flex flex-col gap-1 max-w-sm">
        <p
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </p>
        {description && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
