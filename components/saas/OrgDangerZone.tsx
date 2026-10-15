"use client"

import { useState } from "react"
import { AlertTriangle, ArrowRightLeft, LogOut, Trash2 } from "lucide-react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { clearSWRCache } from "@/components/SWRProvider"
import { setActiveOrgId } from "@/lib/activeOrg"
import { deleteOrganization, leaveOrganization, transferOwnership } from "@/lib/saas/account"
import { saasErrorMessage } from "@/lib/saas/services"
import type { OrgMember } from "@/lib/api"
import { toast } from "@/lib/toast"

/**
 * Acciones de ciclo de vida de la organización: salir (miembros), transferir la propiedad
 * y eliminar el negocio (propietario). Todas son destructivas y piden confirmación.
 */
export default function OrgDangerZone({
  orgName,
  isOwner,
  members,
  currentUserEmail,
}: {
  orgName: string
  isOwner: boolean
  members: OrgMember[]
  currentUserEmail?: string
}) {
  const confirm = useConfirm()
  const [transferOpen, setTransferOpen] = useState(false)
  const [newOwner, setNewOwner] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [busy, setBusy] = useState<string | null>(null)

  const candidates = members.filter((m) => !m.isOwner && m.email.toLowerCase() !== (currentUserEmail ?? "").toLowerCase())

  /** Tras salir o borrar el negocio, la organización activa ya no existe: se reinicia el contexto. */
  function resetContextAndGo() {
    clearSWRCache()
    setActiveOrgId(null)
    window.location.replace("/dashboard")
  }

  async function handleLeave() {
    const ok = await confirm({
      title: "Salir del negocio",
      itemName: orgName,
      description: "Perderás el acceso a sus datos. Para volver necesitarás una nueva invitación.",
      confirmLabel: "Salir",
      variant: "danger",
    })
    if (!ok) return
    setBusy("leave")
    try {
      await leaveOrganization()
      toast.success("Saliste del negocio")
      resetContextAndGo()
    } catch (err) {
      toast.error("No se pudo salir del negocio", { description: saasErrorMessage(err) })
      setBusy(null)
    }
  }

  async function handleTransfer() {
    if (!newOwner) return
    const target = candidates.find((m) => m.userId === newOwner)
    setBusy("transfer")
    try {
      await transferOwnership(newOwner)
      toast.success("Propiedad transferida", { description: target?.name })
      setTransferOpen(false)
      window.location.reload()
    } catch (err) {
      toast.error("No se pudo transferir la propiedad", { description: saasErrorMessage(err) })
      setBusy(null)
    }
  }

  async function handleDelete() {
    setBusy("delete")
    try {
      await deleteOrganization(confirmName.trim())
      toast.success("Negocio eliminado")
      resetContextAndGo()
    } catch (err) {
      toast.error("No se pudo eliminar el negocio", { description: saasErrorMessage(err) })
      setBusy(null)
    }
  }

  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "var(--bg-surface)", border: "1px solid #FECACA" }}>
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} style={{ color: "#EF4444" }} aria-hidden="true" />
        <p className="text-xs font-semibold tracking-widest" style={{ color: "#991B1B" }}>ZONA DE RIESGO</p>
      </div>

      {!isOwner ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Puedes dejar este negocio cuando quieras.</p>
          <Button variant="danger" size="sm" onClick={handleLeave} loading={busy === "leave"}>
            <LogOut size={14} aria-hidden="true" /> Salir del negocio
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm max-w-md" style={{ color: "var(--text-secondary)" }}>
              Transfiere la propiedad a otro miembro. Tú pasarás a ser gerente.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setTransferOpen(true)} disabled={candidates.length === 0}>
              <ArrowRightLeft size={14} aria-hidden="true" /> Transferir propiedad
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm max-w-md" style={{ color: "var(--text-secondary)" }}>
              Elimina el negocio con todos sus datos y cancela su suscripción (sin reembolso). No se puede deshacer.
            </p>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} aria-hidden="true" /> Eliminar negocio
            </Button>
          </div>
        </>
      )}

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transferir propiedad"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTransferOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleTransfer} disabled={!newOwner} loading={busy === "transfer"}>
              Transferir
            </Button>
          </div>
        }
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
            Elige al nuevo propietario de <strong>{orgName}</strong>:
          </legend>
          {candidates.map((m) => (
            <label
              key={m.userId}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
              style={{ border: `1px solid ${newOwner === m.userId ? "var(--accent)" : "var(--border-light)"}` }}
            >
              <input type="radio" name="owner" checked={newOwner === m.userId} onChange={() => setNewOwner(m.userId)} />
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{m.email}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setConfirmName("") }}
        title="Eliminar negocio"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setDeleteOpen(false); setConfirmName("") }}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} disabled={confirmName.trim() !== orgName} loading={busy === "delete"}>
              Eliminar definitivamente
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Se eliminarán ingredientes, recetas, menús y miembros, y se cancelará la suscripción sin reembolso.
            Escribe el nombre exacto del negocio para confirmar:
          </p>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={orgName}
            aria-label="Nombre del negocio"
            autoComplete="off"
          />
        </div>
      </Modal>
    </div>
  )
}
