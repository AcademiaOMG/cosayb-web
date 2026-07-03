"use client"

import useSWR from "swr"
import { useState } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { getMyProfile, updateMyProfile } from "@/lib/api"
import { User, Mail, Clock } from "lucide-react"

/**
 * Mi cuenta — perfil PERSONAL del usuario.
 * La configuración del negocio vive en /configuracion/*.
 */
export default function CuentaPage() {
  const { data: profile, mutate: mutateProfile } = useSWR(
    "my-profile",
    () => getMyProfile().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const [name, setName] = useState("")
  const [nameInit, setNameInit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  if (profile?.name && !nameInit) {
    setName(profile.name)
    setNameInit(true)
  }

  async function handleSave() {
    if (!name.trim() || name === profile?.name) return
    setSaving(true)
    setMsg(null)
    try {
      await updateMyProfile({ name: name.trim() })
      await mutateProfile()
      setMsg("Nombre actualizado")
      setTimeout(() => setMsg(null), 3000)
    } catch {
      setMsg("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader title="Mi cuenta" subtitle="Tu información personal" />

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <User size={18} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            MI PERFIL
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              {profile?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1">
              <Input
                label="Nombre"
                value={name}
                onChange={(e) => { setName(e.target.value); setMsg(null) }}
                placeholder="Tu nombre"
              />
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
          >
            <Mail size={14} style={{ color: "var(--text-muted)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Correo electrónico</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {profile?.email ?? "—"}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
          >
            <Clock size={14} style={{ color: "var(--text-muted)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Miembro desde</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          {msg && (
            <p className="text-xs" style={{ color: msg.includes("Error") ? "#EF4444" : "#16A34A" }}>
              {msg}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !name.trim() || name === profile?.name}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
