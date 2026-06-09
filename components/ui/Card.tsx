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
      className={clsx("rounded-xl p-6", className)}
      style={{
        background: "var(--bg-surface)",
        border:
          variant === "bordered"
            ? "2px solid var(--accent)"
            : "1px solid var(--border-light)",
      }}
      {...props}
    >
      {children}
    </div>
  )
}
