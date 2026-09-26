"use client"

import { useEffect, useRef, useState } from "react"

/** Anima un número desde 0 hasta `target` una vez, cada vez que `target`
 * cambia — el "momento" de revelado del resultado. Respeta prefers-reduced-motion
 * (duración efectiva 0 — salta directo al valor final en el primer frame). */
export function useCountUp(target: number, durationMs = 650) {
  const [value, setValue] = useState(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const effectiveDuration = reduceMotion ? 0 : durationMs
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = effectiveDuration === 0 ? 1 : Math.min(1, elapsed / effectiveDuration)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(target * eased)
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, durationMs])

  return value
}
