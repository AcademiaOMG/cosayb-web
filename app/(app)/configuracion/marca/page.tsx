"use client"

import useSWR from "swr"
import { useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import { getCurrentOrganization, updateOrganization } from "@/lib/api"
import { Building2, Palette } from "lucide-react"

/**
 * Marca — identidad del negocio.
 * v1: nombre del negocio. Aquí entrará el branding completo del tenant
 * (logo, colores, datos fiscales, moneda) en el sub-proyecto B.
 */
export default function MarcaPage() {
  const { data: orgData, mutate: mutateOrg } = useSWR(
    "organization-me",
    () => getCurrentOrganization().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const [orgName, setOrgName] = useState("")
  const [nameInit, setNameInit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingName, setPendingName] = useState("")

  if (orgData?.name && !nameInit) {
    setOrgName(orgData.name)
    setNameInit(true)
  }

  function handleRequestSave() {
    if (!orgName.trim() || orgName === orgData?.name) return
    setPendingName(orgName.trim())
    setConfirmOpen(true)
  }

  async function confirmSave() {
    if (!orgData) return
    setSaving(true)
    setMsg(null)
    try {
      await updateOrganization(orgData.id, { name: pendingName })
      await mutateOrg()
      setMsg("Nombre actualizado")
      setConfirmOpen(false)
      setTimeout(() => setMsg(null), 3000)
    } catch {
      setMsg("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Building2 size={18} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            IDENTIDAD DEL NEGOCIO
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Nombre del negocio"
                value={orgName}
                onChange={(e) => { setOrgName(e.target.value); setMsg(null) }}
                placeholder="Mi restaurante"
              />
            </div>
            <Button
              variant="primary"
              onClick={handleRequestSave}
              disabled={saving || !orgName.trim() || orgName === orgData?.name}
              className="mb-0.5"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
          {msg && (
            <p className="text-xs" style={{ color: msg.includes("Error") ? "#EF4444" : "#16A34A" }}>
              {msg}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-3">
          <Palette size={18} style={{ color: "var(--text-muted)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            PERSONALIZACIÓN VISUAL
          </p>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Logo, colores de marca y datos fiscales de tu negocio — próximamente.
        </p>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Cambiar nombre del negocio"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmSave} disabled={saving}>
              {saving ? "Guardando..." : "Confirmar"}
            </Button>
          </div>
        }
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          ¿Estás seguro de cambiar el nombre a{" "}
          <strong style={{ color: "var(--text-primary)" }}>&ldquo;{pendingName}&rdquo;</strong>?
        </p>
      </Modal>
    </div>
  )
}
