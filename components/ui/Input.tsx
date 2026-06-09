"use client"

import { InputHTMLAttributes, forwardRef, useId } from "react"
import { clsx } from "clsx"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id: idProp, className, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "h-10 w-full rounded-xl px-3 text-sm outline-none transition-colors",
            "placeholder:text-[var(--text-muted)]",
            "focus:ring-2",
            className
          )}
          style={{
            background: "var(--bg-surface)",
            border: error
              ? "1px solid #B42020"
              : "1px solid var(--border-light)",
            color: "var(--text-primary)",
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${id}-error`}
            className="text-xs"
            style={{ color: "#B42020" }}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${id}-hint`}
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"
export default Input
