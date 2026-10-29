"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Contador animado.
 * Origen: idea de "Count Up" de React Bits (https://reactbits.dev, DavidHDev/react-bits),
 * licencia MIT + Commons Clause (uso dentro de una aplicación permitido; no se redistribuye el componente).
 * Reescrito sin dependencias (rAF + easing), con prefers-reduced-motion respetado.
 */
export default function CountUp({ to, duration = 1100, suffix = "", className }: { to: number; duration?: number; suffix?: string; className?: string }) {
  const [v, setV] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || to === 0) {
      raf.current = requestAnimationFrame(() => setV(to))
      return () => cancelAnimationFrame(raf.current)
    }
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to, duration])
  return (
    <span className={className} aria-label={`${to}${suffix}`}>
      <span aria-hidden="true">
        {v}
        {suffix}
      </span>
    </span>
  )
}
