import { HTMLAttributes } from "react"
import { clsx } from "clsx"

export type BadgeVariant = "accent" | "success" | "warning" | "muted"

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const styles: Record<BadgeVariant, React.CSSProperties> = {
  accent: { background: "var(--accent-light)", color: "var(--accent-text)" },
  success: { background: "#D1FAE5", color: "#065F46" },
  warning: { background: "#FEF3C7", color: "#92400E" },
  muted: { background: "var(--bg-secondary)", color: "var(--text-muted)" },
}

export default function Badge({
  variant = "muted",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        className
      )}
      style={styles[variant]}
      {...props}
    >
      {children}
    </span>
  )
}
