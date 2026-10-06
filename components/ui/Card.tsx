import { HTMLAttributes } from "react"
import { clsx } from "clsx"

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  // glass: nivel sutil de Liquid Glass (ver docs/design-system.md)
  variant?: "default" | "bordered" | "glass"
}

export default function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  const isGlass = variant === "glass"

  return (
    <div
      className={clsx("p-6", isGlass && "glass", className)}
      style={
        isGlass
          ? undefined
          : {
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: variant === "bordered" ? "2px solid var(--accent)" : "none",
              boxShadow: variant === "bordered" ? "none" : "var(--shadow-sm)",
            }
      }
      {...props}
    >
      {children}
    </div>
  )
}
