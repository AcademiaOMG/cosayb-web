"use client"

export interface SectionTab { id: string; label: string; badge?: number }

/** Pestañas de una ficha. El contenido de cada una se monta solo al abrirla (así sus datos se piden al verla). */
export default function SectionTabs({ tabs, active, onChange }: { tabs: SectionTab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" aria-label="Secciones" className="flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-light)" }}>
      {tabs.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={on}
            aria-controls={`panel-${t.id}`}
            type="button"
            onClick={() => onChange(t.id)}
            className="shrink-0 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${on ? "var(--accent)" : "transparent"}`,
              color: on ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {t.label}
            {t.badge ? <span className="ml-1.5 text-xs" style={{ opacity: 0.75 }}>{t.badge}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
