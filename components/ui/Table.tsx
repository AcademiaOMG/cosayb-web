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
}

export default function Table({ columns, data, emptyState, rowKey }: TableProps) {
  return (
    <div
      className="w-full overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--border-light)" }}
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
                style={{
                  borderTop: "1px solid var(--border-light)",
                  background:
                    rowIndex % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)",
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
  )
}
