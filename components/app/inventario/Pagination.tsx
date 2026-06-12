"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { clsx } from "clsx"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Compact mode hides individual page buttons */
  compact?: boolean
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  compact = false,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  // Build page numbers to display (show max 5 around current)
  function buildPages(): (number | "ellipsis")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | "ellipsis")[] = [1]

    if (currentPage > 3) pages.push("ellipsis")

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage < totalPages - 2) pages.push("ellipsis")

    pages.push(totalPages)
    return pages
  }

  const pages = compact ? [] : buildPages()

  function PageButton({
    page,
    active,
  }: {
    page: number
    active: boolean
  }) {
    return (
      <button
        type="button"
        onClick={() => onPageChange(page)}
        aria-label={`Página ${page}`}
        aria-current={active ? "page" : undefined}
        className="h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
        style={
          active
            ? {
                background: "var(--accent)",
                color: "#fff",
                boxShadow: "0 1px 4px rgba(27,79,216,0.3)",
              }
            : {
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid transparent",
              }
        }
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "var(--bg-secondary)"
            e.currentTarget.style.borderColor = "var(--border-light)"
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.borderColor = "transparent"
          }
        }}
      >
        {page}
      </button>
    )
  }

  return (
    <nav
      className="flex items-center justify-between gap-4 pt-2"
      aria-label="Paginación de ingredientes"
    >
      {/* Prev */}
      <button
        type="button"
        onClick={() => hasPrev && onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        aria-label="Página anterior"
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-150",
          "disabled:pointer-events-none disabled:opacity-40",
          "focus-visible:outline-none focus-visible:ring-2"
        )}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          if (hasPrev) e.currentTarget.style.borderColor = "var(--border-medium)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-light)"
        }}
      >
        <ChevronLeft size={14} />
        Anterior
      </button>

      {/* Pages or compact info */}
      {compact ? (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          Página{" "}
          <span
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {currentPage}
          </span>{" "}
          de{" "}
          <span
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {totalPages}
          </span>
        </span>
      ) : (
        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 text-sm select-none"
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <PageButton key={p} page={p} active={p === currentPage} />
            )
          )}
        </div>
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => hasNext && onPageChange(currentPage + 1)}
        disabled={!hasNext}
        aria-label="Página siguiente"
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-150",
          "disabled:pointer-events-none disabled:opacity-40",
          "focus-visible:outline-none focus-visible:ring-2"
        )}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          if (hasNext) e.currentTarget.style.borderColor = "var(--border-medium)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-light)"
        }}
      >
        Siguiente
        <ChevronRight size={14} />
      </button>
    </nav>
  )
}
