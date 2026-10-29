"use client"

import type { CSSProperties, ReactNode } from "react"

/**
 * Tarjeta con luz que sigue al cursor.
 * Origen: "Spotlight Card" de React Bits (https://reactbits.dev, DavidHDev/react-bits),
 * licencia MIT + Commons Clause. Versión propia solo con CSS variables (sin re-render por movimiento).
 */
export default function SpotlightCard({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`l-spot ${className}`}
      style={style}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`)
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`)
      }}
    >
      {children}
    </div>
  )
}
