"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"
import { clsx } from "clsx"
import LoadingSpinner from "./LoadingSpinner"

export type ButtonVariant = "primary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, disabled, children, className, ...props },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        style={
          variant === "primary"
            ? ({
                "--btn-bg": "var(--accent)",
                "--btn-hover": "var(--accent-hover)",
                "--btn-text": "#fff",
                "--btn-ring": "var(--accent)",
                background: "var(--btn-bg)",
                color: "var(--btn-text)",
              } as React.CSSProperties)
            : variant === "ghost"
            ? ({
                "--btn-bg": "transparent",
                "--btn-hover": "var(--bg-secondary)",
                "--btn-text": "var(--text-primary)",
                "--btn-ring": "var(--border-medium)",
                background: "transparent",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
              } as React.CSSProperties)
            : ({
                "--btn-bg": "#B42020",
                "--btn-hover": "#8F1A1A",
                "--btn-text": "#fff",
                "--btn-ring": "#B42020",
                background: "var(--btn-bg)",
                color: "var(--btn-text)",
              } as React.CSSProperties)
        }
        onMouseEnter={(e) => {
          if (!isDisabled) {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              "var(--btn-hover)"
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              "var(--btn-bg)"
          }
        }}
        {...props}
      >
        {loading && <LoadingSpinner size={size === "lg" ? 20 : 16} />}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
export default Button
