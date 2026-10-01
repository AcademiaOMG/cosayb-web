import type React from "react"

export interface Column {
  key: string
  header?: string
  label?: string
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

export interface TableProps {
  columns: Column[]
  data: Record<string, unknown>[]
  emptyState?: React.ReactNode
  rowKey?: string
  onRowClick?: (row: Record<string, unknown>) => void
  /**
   * Card propia para móvil. Si no se pasa, Table deriva una de `columns`:
   * la primera columna como título, las intermedias como filas
   * etiqueta/valor y la última (sin header/label = columna de acciones)
   * como zona de acciones al pie de la card.
   */
  renderMobileCard?: (row: Record<string, unknown>) => React.ReactNode
}

const SURFACE: React.CSSProperties = {
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-sm)",
}

// ── Mobile: lista de tarjetas derivada de las mismas columnas ────────────────
// Patrón responsive del proyecto: esta rama vive bajo `md:hidden` y la tabla
// desktop queda idéntica bajo `hidden md:block` (ver IngredientRow.tsx).
function MobileCards({
  columns,
  data,
  emptyState,
  rowKey,
  onRowClick,
  renderMobileCard,
}: Pick<TableProps, "columns" | "data" | "emptyState" | "rowKey" | "onRowClick" | "renderMobileCard">) {
  if (data.length === 0) {
    return (
      <div className="px-4 py-12 text-center" style={{ background: "var(--bg-surface)" }}>
        {emptyState ?? (
          <span style={{ color: "var(--text-muted)" }}>Sin datos</span>
        )}
      </div>
    )
  }

  const lastIndex = columns.length - 1
  const lastCol = columns[lastIndex]
  const hasActions = columns.length > 1 && !(lastCol.header ?? lastCol.label)
  const pairCols = hasActions ? columns.slice(1, lastIndex) : columns.slice(1)

  return (
    <ul className="flex flex-col">
      {data.map((row, rowIndex) => {
        const rowId = rowKey ? String(row[rowKey] ?? rowIndex) : String(rowIndex)

        if (renderMobileCard) {
          return <li key={rowId}>{renderMobileCard(row)}</li>
        }

        const titleCol = columns[0]
        const title = titleCol.render
          ? titleCol.render(row[titleCol.key], row)
          : String(row[titleCol.key] ?? "")
        const titleText = typeof title === "string" ? title : undefined

        return (
          <li
            key={rowId}
            className="relative"
            style={{
              background:
                rowIndex % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)",
            }}
          >
            {/* Fila completa clicable → misma interacción que la tabla desktop.
                Las acciones van por encima (z-10) y ya hacen stopPropagation. */}
            {onRowClick && (
              <button
                type="button"
                onClick={() => onRowClick(row)}
                aria-label={titleText ? `Ver detalle de ${titleText}` : "Ver detalle"}
                className="absolute inset-0 z-0 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              />
            )}

            <div className="pointer-events-none relative flex flex-col gap-2 px-4 py-3">
              <div
                className="text-[15px] font-semibold leading-snug break-words"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </div>

              {pairCols.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {pairCols.map((col) => (
                    <div key={col.key} className="flex items-start justify-between gap-3">
                      <span
                        className="shrink-0 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {col.header ?? col.label ?? col.key}
                      </span>
                      <div
                        className="min-w-0 text-right text-xs font-medium break-words"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : String(row[col.key] ?? "")}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasActions && lastCol.render && (
                <div className="pointer-events-auto relative z-10 flex items-center justify-end">
                  {lastCol.render(row[lastCol.key], row)}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default function Table({ columns, data, emptyState, rowKey, onRowClick, renderMobileCard }: TableProps) {
  return (
    <>
      {/* Desktop: tabla original, sin cambios funcionales */}
      <div
        className="hidden md:block w-full overflow-hidden"
        style={SURFACE}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "var(--bg-secondary)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {col.header ?? col.label ?? col.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  {emptyState ?? (
                    <span style={{ color: "var(--text-muted)" }}>
                      Sin datos
                    </span>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = rowKey ? String(row[rowKey] ?? rowIndex) : String(rowIndex)
                return (
                <tr
                  key={rowId}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    background:
                      rowIndex % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)",
                    cursor: onRowClick ? "pointer" : undefined,
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: tarjetas en vez de columnas numéricas densas */}
      <div
        className="md:hidden w-full overflow-hidden"
        style={SURFACE}
      >
        <MobileCards
          columns={columns}
          data={data}
          emptyState={emptyState}
          rowKey={rowKey}
          onRowClick={onRowClick}
          renderMobileCard={renderMobileCard}
        />
      </div>
    </>
  )
}
