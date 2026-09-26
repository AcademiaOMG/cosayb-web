import { HTMLAttributes } from "react"
import { clsx } from "clsx"

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered"
}

export default function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx("p-6", className)}
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
        border: variant === "bordered" ? "2px solid var(--accent)" : "none",
        boxShadow: variant === "bordered" ? "none" : "var(--shadow-sm)",
      }}
      {...props}
    >
      {children}
    </div>
  )
}
