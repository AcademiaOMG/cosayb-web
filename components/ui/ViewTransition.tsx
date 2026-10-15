import type { ReactNode } from "react"

/**
 * Contenedor que anima su entrada cada vez que cambia su `key` (pasa `key={vista}`):
 * así cambiar de pestaña o de vista dentro de una página se siente igual que
 * cambiar de página. Mismo movimiento en toda la app (clase .anim-view).
 */
export default function ViewTransition({ children }: { children: ReactNode }) {
  return <div className="anim-view flex flex-col gap-6">{children}</div>
}
