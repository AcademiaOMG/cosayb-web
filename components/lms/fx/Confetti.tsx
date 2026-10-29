"use client"

const COLORS = ["var(--accent)", "#f0527e", "#f59e0b", "#22b573", "var(--accent-hover)", "var(--accent-light)"]

/**
 * Celebración de confeti con CSS puro (transform/opacity). Decorativo: aria-hidden.
 * Inspirado en los fondos/partículas de React Bits (MIT + Commons Clause); implementación propia.
 * Con prefers-reduced-motion las piezas se ocultan (ver lms.css).
 */
export default function Confetti({ count = 46 }: { count?: number }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280 // determinista: sin diferencias de hidratación
    return {
      left: `${Math.round(r(1) * 100)}%`,
      dx: `${Math.round((r(2) - 0.5) * 220)}px`,
      rot: `${Math.round(r(3) * 720 - 360)}deg`,
      delay: `${Math.round(r(4) * 700)}ms`,
      bg: COLORS[i % COLORS.length],
    }
  })
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="l-confetti-piece" style={{ left: p.left, background: p.bg, animationDelay: p.delay, ["--dx" as string]: p.dx, ["--rot" as string]: p.rot }} />
      ))}
    </div>
  )
}
