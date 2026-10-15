"use client"

import useSWR from "swr"
import { useState } from "react"
import { Check, X } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { platformListMemberships, platformUpdateFeature, platformSetMembershipRoles, platformListRoles } from "@/lib/api"
import ErrorState from "@/components/ui/ErrorState"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import {
  featureLabel, featureDescription, featureIsLimit, featureUnit, formatFeatureValue,
  membershipLabel, parseLimitInput, roleLabel, roleDescription,
} from "@/lib/plataforma/labels"

const TIER_STYLE: Record<string, { color: string }> = {
  free: { color: "var(--text-muted)" },
  pro: { color: "var(--accent)" },
  academia: { color: "#16A34A" },
}

const TIERS = ["free", "pro", "academia"] as const

type Feature = { id: string; membership: string; featureKey: string; enabled: boolean; limitValue: number | null; lockedMessage: string | null }

/** Orden y nombre de los bloques en que se agrupan las funciones. */
const SECTIONS: { id: string; title: string; match: (key: string) => boolean }[] = [
  { id: "limits", title: "Límites de uso", match: (k) => featureIsLimit(k) },
  { id: "modules", title: "Módulos disponibles", match: (k) => k.startsWith("module_") },
  { id: "features", title: "Otras funciones", match: (k) => !featureIsLimit(k) && !k.startsWith("module_") },
]

export default function MembresiasPage() {
  const { platformCan } = usePermissions()
  const { data, error, mutate } = useSWR("platform-memberships", () =>
    platformListMemberships().then((r) => r.data)
  )
  const { data: allRoles = [] } = useSWR("platform-roles-catalog", () =>
    platformListRoles().then((r) => r.data.filter((role) => role.scope === "organization" && role.slug !== "org_owner"))
  )
  const [view, setView] = useState<"edit" | "compare">("edit")
  const [saving, setSaving] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const canEdit = platformCan("platform_memberships", "update")

  const featuresByTier = (tier: string) => (data?.features ?? []).filter((f) => f.membership === tier)
  const rolesByTier = (tier: string) => (data?.roleLimits ?? []).filter((r) => r.membership === tier)

  function setFieldError(field: string, message: string | null) {
    setErrors((prev) => {
      const next = { ...prev }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  /** Ejecuta un guardado: marca el campo ocupado, avisa del resultado y refresca. */
  async function run(field: string, okText: string, action: () => Promise<unknown>) {
    setSaving(field)
    try {
      await action()
      await mutate()
      toast.success("Cambio guardado", { description: okText })
    } catch (e) {
      toast.error("No se pudo guardar el cambio", { description: friendlyError(e, "Revisa tu conexión e inténtalo de nuevo.") })
      await mutate()
    } finally {
      setSaving(null)
    }
  }

  function toggleFeature(tier: string, f: Feature, enabled: boolean) {
    return run(`${tier}:${f.featureKey}`, `${featureLabel(f.featureKey)} (${membershipLabel(tier)}): ${enabled ? "ahora está incluido" : "ya no está incluido"}.`, () =>
      platformUpdateFeature(tier, f.featureKey, { enabled })
    )
  }

  function changeLimit(tier: string, f: Feature, raw: string) {
    const field = `${tier}:${f.featureKey}`
    const parsed = parseLimitInput(raw)
    if (!parsed.ok) { setFieldError(field, parsed.error); return }
    setFieldError(field, null)
    if (parsed.value === f.limitValue) return
    return run(field, `${featureLabel(f.featureKey)} (${membershipLabel(tier)}): ${formatFeatureValue(f.featureKey, true, parsed.value)}.`, () =>
      platformUpdateFeature(tier, f.featureKey, { limitValue: parsed.value })
    )
  }

  function changeLockedMessage(tier: string, f: Feature, raw: string) {
    const value = raw.trim() || null
    if (value === (f.lockedMessage ?? null)) return
    if (value && value.length > 200) { setFieldError(`${tier}:${f.featureKey}:msg`, "El mensaje puede tener hasta 200 caracteres."); return }
    setFieldError(`${tier}:${f.featureKey}:msg`, null)
    return run(`${tier}:${f.featureKey}`, "Mensaje de bloqueo actualizado.", () =>
      platformUpdateFeature(tier, f.featureKey, { lockedMessage: value })
    )
  }

  function toggleRole(tier: string, roleId: string, enabled: boolean) {
    const current = rolesByTier(tier).map((r) => ({ roleId: r.roleId, maxUsers: r.maxUsers }))
    const next = enabled ? [...current, { roleId, maxUsers: null }] : current.filter((r) => r.roleId !== roleId)
    return run(`${tier}:role:${roleId}`, enabled ? "Rol habilitado en el plan." : "Rol retirado del plan.", () =>
      platformSetMembershipRoles(tier, next)
    )
  }

  function changeRoleMaxUsers(tier: string, roleId: string, raw: string, previous: number | null) {
    const field = `${tier}:role:${roleId}`
    const parsed = parseLimitInput(raw)
    if (!parsed.ok) { setFieldError(field, parsed.error); return }
    setFieldError(field, null)
    if (parsed.value === previous) return
    const next = rolesByTier(tier).map((r) => ({ roleId: r.roleId, maxUsers: r.roleId === roleId ? parsed.value : r.maxUsers }))
    return run(field, "Máximo de personas con este rol actualizado.", () => platformSetMembershipRoles(tier, next))
  }

  // Funciones en el orden en que las entrega el API (las mismas claves en cada plan)
  const featureKeys = [...new Set((data?.features ?? []).map((f) => f.featureKey))]
  const findFeature = (tier: string, key: string) => featuresByTier(tier).find((f) => f.featureKey === key)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Planes y membresías</h1>
        <p className="text-sm console-muted mt-1">
          Qué incluye cada plan y hasta cuánto puede usar un negocio. Los cambios aplican a todos los negocios que tengan ese plan.
        </p>
      </div>

      <div role="tablist" aria-label="Vista" className="flex gap-1">
        {([["edit", "Editar planes"], ["compare", "Comparar planes"]] as const).map(([id, text]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: view === id ? "var(--accent-light)" : "transparent",
              color: view === id ? "var(--accent)" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {text}
          </button>
        ))}
      </div>

      {error && !data && <ErrorState title="No pudimos cargar los planes" onRetry={() => void mutate()} />}
      {!data && !error && <p className="text-sm console-muted">Cargando…</p>}

      {data && view === "compare" && (
        <div className="console-card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th scope="col" className="text-left p-2 console-title">Qué incluye</th>
                {TIERS.map((tier) => (
                  <th key={tier} scope="col" className="p-2 text-center font-bold" style={{ color: TIER_STYLE[tier].color }}>
                    {membershipLabel(tier)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTIONS.flatMap((section) => {
                const keys = featureKeys.filter(section.match)
                if (keys.length === 0) return []
                return [
                  <tr key={`s-${section.id}`}>
                    <th colSpan={TIERS.length + 1} scope="colgroup" className="text-left text-[11px] uppercase tracking-wide console-muted pt-4 pb-1 px-2">
                      {section.title}
                    </th>
                  </tr>,
                  ...keys.map((key) => (
                    <tr key={key} style={{ borderTop: "1px solid var(--border-light)" }}>
                      <th scope="row" className="text-left p-2 font-medium console-title" title={featureDescription(key)}>
                        {featureLabel(key)}
                      </th>
                      {TIERS.map((tier) => {
                        const f = findFeature(tier, key)
                        const text = f ? formatFeatureValue(key, f.enabled, f.limitValue) : "No incluido"
                        const included = !!f?.enabled
                        return (
                          <td key={tier} className="p-2 text-center">
                            <span className="inline-flex items-center gap-1" style={{ color: included ? "var(--text-primary)" : "var(--text-muted)" }}>
                              {!featureIsLimit(key) && (included
                                ? <Check size={14} aria-hidden style={{ color: "#16A34A" }} />
                                : <X size={14} aria-hidden />)}
                              {text}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )),
                ]
              })}
              <tr>
                <th colSpan={TIERS.length + 1} scope="colgroup" className="text-left text-[11px] uppercase tracking-wide console-muted pt-4 pb-1 px-2">
                  Roles que se pueden asignar al equipo
                </th>
              </tr>
              {allRoles.map((role) => (
                <tr key={role.id} style={{ borderTop: "1px solid var(--border-light)" }}>
                  <th scope="row" className="text-left p-2 font-medium console-title" title={roleDescription(role.slug)}>
                    {roleLabel(role.slug)}
                  </th>
                  {TIERS.map((tier) => {
                    const a = rolesByTier(tier).find((r) => r.roleId === role.id)
                    return (
                      <td key={tier} className="p-2 text-center console-muted">
                        {a ? (a.maxUsers === null ? "Sin tope de personas" : `Hasta ${a.maxUsers} ${a.maxUsers === 1 ? "persona" : "personas"}`) : "No incluido"}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && view === "edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {TIERS.map((tier) => (
            <div key={tier} className="console-card flex flex-col gap-5">
              <h2 className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: TIER_STYLE[tier].color }}>
                Plan {membershipLabel(tier)}
              </h2>

              {SECTIONS.map((section) => {
                const list = featuresByTier(tier).filter((f) => section.match(f.featureKey))
                if (list.length === 0) return null
                return (
                  <div key={section.id}>
                    <p className="text-[10px] font-bold tracking-widest console-muted mb-2 uppercase">{section.title}</p>
                    <div className="flex flex-col gap-2">
                      {list.map((f) => {
                        const field = `${tier}:${f.featureKey}`
                        const limit = featureIsLimit(f.featureKey)
                        const busy = saving === field
                        return (
                          <div key={f.id} className="flex flex-col gap-1" title={featureDescription(f.featureKey)}>
                            <div className="flex items-center gap-2">
                              <input
                                id={`f-${field}`}
                                type="checkbox"
                                checked={f.enabled}
                                disabled={!canEdit || busy}
                                onChange={(e) => void toggleFeature(tier, f, e.target.checked)}
                                style={{ accentColor: "var(--accent)", cursor: canEdit ? "pointer" : "default" }}
                              />
                              <label htmlFor={`f-${field}`} className="flex-1 text-xs console-title">
                                {featureLabel(f.featureKey)}
                              </label>
                              {limit && f.enabled && (
                                <span className="flex items-center gap-1">
                                  <input
                                    key={`${f.limitValue}`}
                                    type="text"
                                    inputMode="numeric"
                                    defaultValue={f.limitValue ?? ""}
                                    placeholder="Ilimitado"
                                    aria-label={`Cuántos(as) ${featureUnit(f.featureKey)}: ${featureLabel(f.featureKey)}. Vacío significa ilimitado`}
                                    aria-invalid={!!errors[field]}
                                    disabled={!canEdit || busy}
                                    onBlur={(e) => canEdit && void changeLimit(tier, f, e.target.value)}
                                    className="console-input text-xs text-right"
                                    style={{ width: 84, height: 26, paddingRight: 6 }}
                                  />
                                </span>
                              )}
                            </div>
                            {errors[field] && <p role="alert" className="text-[11px] ml-6" style={{ color: "#DC2626" }}>{errors[field]}</p>}
                            {!limit && <p className="text-[11px] console-muted ml-6">{f.enabled ? "Incluido" : "No incluido"}</p>}
                            {limit && !f.enabled && <p className="text-[11px] console-muted ml-6">No incluido</p>}
                            {!f.enabled && (
                              <>
                                <input
                                  type="text"
                                  defaultValue={f.lockedMessage ?? ""}
                                  placeholder="Mensaje que verá el cliente (opcional)"
                                  aria-label={`Mensaje que verá el cliente cuando «${featureLabel(f.featureKey)}» no está incluido (opcional)`}
                                  disabled={!canEdit || busy}
                                  onBlur={(e) => canEdit && void changeLockedMessage(tier, f, e.target.value)}
                                  className="console-input text-[11px] ml-6"
                                  style={{ height: 24, paddingLeft: 8 }}
                                />
                                {errors[`${field}:msg`] && <p role="alert" className="text-[11px] ml-6" style={{ color: "#DC2626" }}>{errors[`${field}:msg`]}</p>}
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              <div>
                <p className="text-[10px] font-bold tracking-widest console-muted mb-2 uppercase">Roles que se pueden asignar</p>
                <div className="flex flex-col gap-2">
                  {allRoles.map((role) => {
                    const assignment = rolesByTier(tier).find((r) => r.roleId === role.id)
                    const field = `${tier}:role:${role.id}`
                    return (
                      <div key={role.id} className="flex flex-col gap-1" title={roleDescription(role.slug)}>
                        <div className="flex items-center gap-2">
                          <input
                            id={`r-${field}`}
                            type="checkbox"
                            checked={!!assignment}
                            disabled={!canEdit || saving === field}
                            onChange={(e) => void toggleRole(tier, role.id, e.target.checked)}
                            style={{ accentColor: "var(--accent)", cursor: canEdit ? "pointer" : "default" }}
                          />
                          <label htmlFor={`r-${field}`} className="flex-1 text-xs console-title">{roleLabel(role.slug)}</label>
                          {assignment && (
                            <input
                              key={`${assignment.maxUsers}`}
                              type="text"
                              inputMode="numeric"
                              defaultValue={assignment.maxUsers ?? ""}
                              placeholder="Sin tope"
                              aria-label={`Máximo de personas con el rol ${roleLabel(role.slug)}. Vacío significa sin tope`}
                              aria-invalid={!!errors[field]}
                              disabled={!canEdit || saving === field}
                              onBlur={(e) => canEdit && void changeRoleMaxUsers(tier, role.id, e.target.value, assignment.maxUsers)}
                              className="console-input text-xs text-right"
                              style={{ width: 84, height: 26, paddingRight: 6 }}
                              title="Máximo de personas que pueden tener este rol a la vez"
                            />
                          )}
                        </div>
                        {errors[field] && <p role="alert" className="text-[11px] ml-6" style={{ color: "#DC2626" }}>{errors[field]}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
