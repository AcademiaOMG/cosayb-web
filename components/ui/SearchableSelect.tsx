"use client"

import { useState, useRef, useEffect, useCallback, useId, useMemo } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Plus, Search, X } from "lucide-react"
import {
  filterOptions,
  moveHighlight,
  placeDropdown,
  shouldOfferCreate,
  type DropdownPlacement,
  type SelectOption,
} from "@/lib/ui/searchableSelect"

export type Option = SelectOption

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  ariaLabel?: string
  /** Texto del buscador dentro del desplegable (por defecto, el mismo placeholder) */
  searchPlaceholder?: string
  /** Si se pasa, agrega bajo el buscador una opción fija que limpia la selección (ej. "Seleccionar receta") */
  clearLabel?: string
  /** "calculator" = el disparador estándar de las calculadoras (hueco oscuro) */
  variant?: "default" | "calculator"
  /** Ajustes puntuales del disparador sobre el de su variante */
  triggerStyle?: React.CSSProperties
  disabled?: boolean
  /** Marca el disparador como inválido (aria-invalid + borde de error), p. ej. obligatorio sin elegir */
  invalid?: boolean
  /** Las opciones se están cargando */
  loading?: boolean
  /** Si se pasa, al buscar sin coincidencia exacta aparece al final «Crear «texto»» y se llama con el texto */
  onCreate?: (query: string) => void
  /**
   * Texto fijo de la opción de crear (p. ej. «¿No encuentras el ingrediente? Agregar ingrediente»).
   * Con esto la opción aparece SIEMPRE al final de la lista (con o sin texto buscado) y `onCreate`
   * recibe lo que se buscó (puede ser vacío). Sin esto, solo sale «Crear «texto»» al buscar sin coincidencia exacta.
   */
  createLabel?: string
}

interface Item {
  value: string
  label: string
  isClear: boolean
  isCreate?: boolean
}

// Los estilos viven en app/globals.css (.ui-select-*): tokens compartidos y
// estados hover / foco / seleccionado / deshabilitado en un solo lugar.

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  ariaLabel,
  variant = "default",
  triggerStyle,
  searchPlaceholder,
  clearLabel,
  disabled = false,
  invalid = false,
  loading = false,
  onCreate,
  createLabel,
}: SearchableSelectProps) {
  const uid = useId()
  const listId = `${uid}-list`
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [placement, setPlacement] = useState<DropdownPlacement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const filteredOptions = useMemo(() => filterOptions(options, search), [options, search])
  // Lista navegable con teclado: la opción fija de "limpiar" (si existe) va primero
  const items = useMemo<Item[]>(() => {
    const real = filteredOptions.map((o) => ({ ...o, isClear: false }))
    const withClear = clearLabel ? [{ value: "", label: clearLabel, isClear: true }, ...real] : real
    return onCreate && (createLabel || shouldOfferCreate(options, search))
      ? [...withClear, { value: "__create", label: createLabel ?? `Crear «${search.trim()}»`, isClear: false, isCreate: true }]
      : withClear
  }, [clearLabel, createLabel, filteredOptions, onCreate, options, search])
  const firstReal = clearLabel ? 1 : 0

  const computePlacement = useCallback((): DropdownPlacement | null => {
    if (!containerRef.current) return null
    return placeDropdown(containerRef.current.getBoundingClientRect(), {
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }, [])

  const closeDropdown = useCallback((returnFocus = false) => {
    setIsOpen(false)
    setSearch("")
    setHighlightIndex(-1)
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  // Cerrar al hacer clic fuera del disparador y de la lista
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node
      if (!containerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) closeDropdown()
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isOpen, closeDropdown])

  // Reubicar al desplazar/redimensionar (no cierra: en móvil el teclado virtual redimensiona)
  useEffect(() => {
    if (!isOpen) return
    function reposition(e?: Event) {
      if (e && dropdownRef.current?.contains(e.target as Node)) return
      const next = computePlacement()
      if (next) setPlacement(next)
    }
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    window.visualViewport?.addEventListener("resize", reposition)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
      window.visualViewport?.removeEventListener("resize", reposition)
    }
  }, [isOpen, computePlacement])

  const openDropdown = useCallback(() => {
    if (disabled) return
    setPlacement(computePlacement())
    setIsOpen(true)
    setSearch("")
    const selectedIdx = options.findIndex((o) => o.value === value)
    setHighlightIndex(selectedIdx >= 0 ? selectedIdx + firstReal : options.length > 0 ? firstReal : -1)
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0)
  }, [disabled, computePlacement, options, value, firstReal])

  const choose = useCallback(
    (item: { value: string; isCreate?: boolean }) => {
      if (item.isCreate) {
        const q = search.trim()
        closeDropdown(true)
        onCreate?.(q)
        return
      }
      onChange(item.value)
      closeDropdown(true)
    },
    [onChange, onCreate, search, closeDropdown],
  )

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        openDropdown()
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault()
        closeDropdown()
      }
    },
    [openDropdown, closeDropdown, isOpen],
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightIndex((prev) => moveHighlight(prev, 1, items.length))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightIndex((prev) => moveHighlight(prev, -1, items.length))
      } else if (e.key === "Home" && items.length) {
        e.preventDefault()
        setHighlightIndex(0)
      } else if (e.key === "End" && items.length) {
        e.preventDefault()
        setHighlightIndex(items.length - 1)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (highlightIndex >= 0 && highlightIndex < items.length) choose(items[highlightIndex])
      } else if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation() // no cierra la ventana que lo contiene
        closeDropdown(true)
      } else if (e.key === "Tab") {
        // Devuelve el foco al disparador (sin preventDefault) para no perderlo en el portal
        closeDropdown(true)
      }
    },
    [items, highlightIndex, choose, closeDropdown],
  )

  // Mantener visible la opción resaltada
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return
    listRef.current.querySelector<HTMLElement>(`[data-idx="${highlightIndex}"]`)?.scrollIntoView({ block: "nearest" })
  }, [highlightIndex])

  const optionId = (i: number) => `${uid}-opt-${i}`

  const panelStyle: React.CSSProperties | undefined = placement
    ? { left: placement.left, width: placement.width, maxHeight: placement.maxHeight, top: placement.top, bottom: placement.bottom }
    : undefined

  const dropdownPanel =
    isOpen && panelStyle ? (
      // app-theme-neutral: el portal cuelga de <body>, fuera del wrapper de la app,
      // y sin esto heredaba los tokens beige del sitio de marketing.
      <div ref={dropdownRef} className="app-theme-neutral ui-select-panel" style={panelStyle}>
        <div className="ui-select-search">
          <Search size={14} aria-hidden style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={highlightIndex >= 0 ? optionId(highlightIndex) : undefined}
            aria-label={searchPlaceholder ?? placeholder}
            autoComplete="off"
            placeholder={searchPlaceholder ?? placeholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setHighlightIndex(firstReal)
            }}
            onKeyDown={handleInputKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
          {search && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={(e) => {
                e.stopPropagation()
                setSearch("")
                inputRef.current?.focus()
              }}
              className="ui-select-search-clear"
            >
              <X size={12} aria-hidden />
            </button>
          )}
        </div>

        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel ?? placeholder}
          aria-busy={loading || undefined}
          className="ui-select-list"
        >
          {loading ? (
            <div className="ui-select-empty" role="status">
              Cargando…
            </div>
          ) : (
            <>
              {items.map((item, idx) => {
                const isSelected = item.isCreate ? false : item.isClear ? value === "" : item.value === value
                return (
                  <div
                    key={item.isCreate ? "__create" : item.isClear ? "__clear" : item.value}
                    id={optionId(idx)}
                    data-idx={idx}
                    role="option"
                    aria-selected={isSelected}
                    data-active={idx === highlightIndex || undefined}
                    data-clear={item.isClear || undefined}
                    data-create={item.isCreate || undefined}
                    className="ui-select-option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(item)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    {item.isCreate && <Plus size={14} aria-hidden className="ui-select-check" />}
                    <span className="ui-select-option-label">{item.label}</span>
                    {isSelected && !item.isClear && !item.isCreate && <Check size={14} aria-hidden className="ui-select-check" />}
                  </div>
                )
              })}
              {filteredOptions.length === 0 && <div className="ui-select-empty">{emptyMessage}</div>}
            </>
          )}
        </div>
      </div>
    ) : null

  return (
    <div ref={containerRef} className="ui-select">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={isOpen ? () => closeDropdown() : openDropdown}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listId : undefined}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        data-variant={variant}
        data-empty={selectedOption ? undefined : true}
        className="ui-select-trigger"
        style={triggerStyle}
      >
        <span className="ui-select-value">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} aria-hidden className="ui-select-chevron" />
      </button>

      {/* Se dibuja en <body> para escapar de overflow/z-index de la ventana que lo contiene */}
      {typeof document !== "undefined" && createPortal(dropdownPanel, document.body)}
    </div>
  )
}
