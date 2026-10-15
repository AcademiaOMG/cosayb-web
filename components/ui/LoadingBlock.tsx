import LoadingSpinner from "./LoadingSpinner"

/** Estado de carga para secciones/paneles (centrado, con texto accesible). */
export default function LoadingBlock({ label = "Cargando…", className }: { label?: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 py-16 text-sm ${className ?? ""}`}
      style={{ color: "var(--text-muted)" }}
      aria-busy="true"
    >
      <LoadingSpinner size={20} color="var(--accent)" />
      <span>{label}</span>
    </div>
  )
}
