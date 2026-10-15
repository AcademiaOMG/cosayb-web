/** Insignia de los extras del menú (vasos, bebidas…), con su unidad si se conoce.
 *  Compartida por Inventario (IngredientRow) y Menú para mantener el mismo lenguaje visual. */
export default function ExtraTag({ unit }: { unit?: string }) {
  return (
    <span
      className="shrink-0 px-1.5 py-px text-[11px] font-semibold leading-4"
      style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", borderRadius: "6px" }}
      title="Extra del menú (bebidas, desechables, acompañamientos…)"
    >
      {unit ? `Extra · ${unit}` : "Extra"}
    </span>
  )
}
