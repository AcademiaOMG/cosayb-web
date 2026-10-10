"use client"

import { keySoundProps } from "./useKeySound"
import "./calculator.css"

/**
 * Tecla en su hueco, para las que viven fuera del teclado numérico
 * (Calcular, Agregar, Cambiar datos…). `calc` = tecla de acción azul, ancha;
 * `fn` = tecla de función azul acero.
 */
export default function CalcActionKey({
  variant = "calc",
  className,
  slotClassName,
  children,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: "calc" | "fn"
  slotClassName?: string
}) {
  return (
    <div className={`calc-slot${slotClassName ? ` ${slotClassName}` : ""}`}>
      <button
        type="button"
        data-k={variant === "calc" ? "enter" : undefined}
        className={`calc-key ${variant === "calc" ? "calc-key-equals" : "calc-key-fn"}${className ? ` ${className}` : ""}`}
        {...keySoundProps}
        {...rest}
      >
        {children}
      </button>
    </div>
  )
}
