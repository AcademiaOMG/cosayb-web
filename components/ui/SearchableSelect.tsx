"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, X } from "lucide-react"

export interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  ariaLabel?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  ariaLabel,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  // Find label of the currently selected option
  const selectedOption = options.find((opt) => opt.value === value)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <div
        onClick={() => { setIsOpen((prev) => !prev); setSearch("") }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "36px",
          borderRadius: "8px",
          border: "1px solid var(--border-light)",
          background: "var(--bg-surface)",
          color: selectedOption ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: "13px",
          padding: "0 10px",
          cursor: "pointer",
          userSelect: "none",
        }}
        aria-label={ariaLabel}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} style={{ color: "var(--text-muted)", marginLeft: "4px", flexShrink: 0 }} />
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {/* Search box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 8px",
              height: "32px",
              borderRadius: "6px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-light)",
            }}
          >
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "12px",
                outline: "none",
                width: "100%",
              }}
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSearch("")
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options list */}
          <div
            style={{
              maxHeight: "110px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                      setSearch("")
                    }}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                      background: isSelected ? "var(--accent-light)" : "transparent",
                      color: isSelected ? "var(--accent)" : "var(--text-primary)",
                      fontWeight: isSelected ? 500 : 400,
                      transition: "background 0.1s ease",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: "1.5",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "var(--bg-secondary)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent"
                      }
                    }}
                  >
                    {opt.label}
                  </div>
                )
              })
            ) : (
              <div
                style={{
                  padding: "8px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
