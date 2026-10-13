"use client"

import useSWR from "swr"
import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import { getCurrentOrganization, updateOrganization } from "@/lib/api"
import { Building2, Palette } from "lucide-react"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"

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
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingName, setPendingName] = useState("")

  useEffect(() => {
    if (orgData?.name) {
      setOrgName(orgData.name)
    }
  }, [orgData?.name])

  function handleRequestSave() {
    if (!orgName.trim() || orgName === orgData?.name) return
    setPendingName(orgName.trim())
    setConfirmOpen(true)
  }

  async function confirmSave() {
    if (!orgData) return
    setSaving(true)
    try {
      await updateOrganization(orgData.id, { name: pendingName })
      await mutateOrg()
      toast.success("Nombre del negocio actualizado", { description: pendingName })
      setConfirmOpen(false)
    } catch (err) {
      setConfirmOpen(false)
      toast.error("No se pudo guardar el nombre del negocio", {
        description: friendlyError(err, "Revisa tu conexión e inténtalo de nuevo."),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="transition-shadow hover:shadow-[0_4px_16px_rgba(18,33,58,0.08)]">
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
                onChange={(e) => setOrgName(e.target.value)}
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
        </div>
      </Card>

      <Card className="transition-shadow hover:shadow-[0_4px_16px_rgba(18,33,58,0.08)]">
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
