"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
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

interface DropdownRect {
  top: number
  left: number
  width: number
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
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const computeRect = useCallback((): DropdownRect | null => {
    if (!containerRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    }
  }, [])

  // Close when clicking outside either the trigger or the portal dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const inContainer = containerRef.current?.contains(target)
      const inDropdown = dropdownRef.current?.contains(target)
      if (!inContainer && !inDropdown) {
        setIsOpen(false)
        setSearch("")
        setHighlightIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close and recompute position on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return
    function handleScrollOrResize() {
      const rect = computeRect()
      if (rect) setDropdownRect(rect)
    }
    window.addEventListener("scroll", handleScrollOrResize, true)
    window.addEventListener("resize", handleScrollOrResize)
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [isOpen, computeRect])

  const openDropdown = useCallback(() => {
    const rect = computeRect()
    setDropdownRect(rect)
    setIsOpen(true)
    setSearch("")
    setHighlightIndex(-1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [computeRect])

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setSearch("")
    setHighlightIndex(-1)
  }, [])

  const selectOption = useCallback((opt: Option) => {
    onChange(opt.value)
    closeDropdown()
  }, [onChange, closeDropdown])

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault()
      openDropdown()
    } else if (e.key === "Escape") {
      closeDropdown()
    }
  }, [openDropdown, closeDropdown])

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
        selectOption(filteredOptions[highlightIndex])
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      closeDropdown()
    }
  }, [filteredOptions, highlightIndex, selectOption, closeDropdown])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightIndex])

  const dropdownPanel = isOpen && dropdownRect ? (
    <div
      ref={dropdownRef}
      id="searchable-select-listbox"
      role="listbox"
      style={{
        position: "fixed",
        top: dropdownRect.top,
        left: dropdownRect.left,
        width: dropdownRect.width,
        zIndex: 9999,
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
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setHighlightIndex(-1) }}
          onKeyDown={handleInputKeyDown}
          onClick={(e) => e.stopPropagation()}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--text-primary)",
            fontSize: "12px",
            outline: "none",
            width: "100%",
          }}
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
      <div ref={listRef} style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt, idx) => {
            const isSelected = opt.value === value
            const isHighlighted = idx === highlightIndex
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(opt)}
                onMouseEnter={() => setHighlightIndex(idx)}
                style={{
                  padding: "6px 8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                  background: isSelected ? "var(--accent-light)" : isHighlighted ? "var(--bg-secondary)" : "transparent",
                  color: isSelected ? "var(--accent)" : "var(--text-primary)",
                  fontWeight: isSelected ? 500 : 400,
                  transition: "background 0.1s ease",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: "1.5",
                  flexShrink: 0,
                }}
              >
                {opt.label}
              </div>
            )
          })
        ) : (
          <div style={{ padding: "8px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  ) : null

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <div
        onClick={isOpen ? closeDropdown : openDropdown}
        onKeyDown={handleTriggerKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="searchable-select-listbox"
        aria-label={ariaLabel}
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
          outline: "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} style={{ color: "var(--text-muted)", marginLeft: "4px", flexShrink: 0 }} />
      </div>

      {/* Dropdown rendered via portal to escape overflow clipping */}
      {typeof document !== "undefined" && createPortal(dropdownPanel, document.body)}
    </div>
  )
}
