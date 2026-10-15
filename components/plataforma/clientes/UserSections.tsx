"use client"

import useSWR from "swr"
import { Monitor } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import ActionCard from "@/components/plataforma/clientes/ActionCard"
import { usePermissions } from "@/hooks/usePermissions"
import { deviceLabel, listUserSessions, revokeUserSessions, sendUserPasswordReset } from "@/lib/plataforma/clientes"
import { fmtDate, timeAgoEs } from "@/lib/saas/format"
import { platformResendVerification } from "@/lib/saas/account"
import { SaasError } from "@/lib/saas/types"
import { saasErrorMessage } from "@/lib/saas/services"
import Button from "@/components/ui/Button"
import { useState } from "react"
import { toast } from "@/lib/toast"

/** Sesiones abiertas del usuario y cierre de todas (con motivo). */
export function SesionesSection({ userId, userName }: { userId: string; userName: string }) {
  const { platformCan } = usePermissions()
  const canEdit = platformCan("platform_users", "update")
  const { data, error, mutate } = useSWR(["clientes-user-sessions", userId], () => listUserSessions(userId), { revalidateOnFocus: false })

  return (
    <div className="flex flex-col gap-4">
      {error && !data ? (
        <ErrorState title="No pudimos cargar las sesiones" onRetry={() => void mutate()} />
      ) : !data ? (
        <LoadingBlock label="Cargando sesiones…" />
      ) : data.length === 0 ? (
        <EmptyState icon={<Monitor size={32} aria-hidden="true" />} title="Sin sesiones abiertas" description={`${userName} no tiene ningún dispositivo con la sesión iniciada.`} />
      ) : (
        <ul className="console-card flex flex-col">
          {data.map((s) => (
            <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5" style={{ borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <p className="text-sm console-title">{deviceLabel(s.userAgent)}</p>
                <p className="text-xs console-muted">Inició el {fmtDate(s.createdAt, "short")}{s.ipAddress ? ` · IP ${s.ipAddress}` : ""}</p>
              </div>
              <span className="text-xs console-muted">Activa {timeAgoEs(s.lastActivityAt)}</span>
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <ActionCard
          title="Cerrar todas las sesiones"
          description="Obliga a iniciar sesión de nuevo en todos los dispositivos. El usuario recibe un aviso por correo."
          confirmTitle="Cerrar todas las sesiones"
          confirmText={`${userName} tendrá que iniciar sesión de nuevo en todos sus dispositivos.`}
          confirmLabel="Cerrar sesiones"
          danger
          successMessage="Sesiones cerradas"
          onRun={async (reason) => { await revokeUserSessions(userId, reason); await mutate() }}
        />
      )}
    </div>
  )
}

/** Acciones de cuenta: verificación de correo y restablecer contraseña. */
export function CuentaActions({ userId, email, emailVerified, }: { userId: string; email: string; emailVerified: boolean }) {
  const { platformCan } = usePermissions()
  const canEdit = platformCan("platform_users", "update")
  const [busy, setBusy] = useState<string | null>(null)

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key)
    try {
      await fn()
      toast.success(ok, { description: email })
    } catch (err) {
      if (err instanceof SaasError && err.code === "ALREADY_VERIFIED") toast.info("Este usuario ya verificó su correo.")
      else toast.error("No se pudo enviar", { description: saasErrorMessage(err) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="console-card flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="console-title">Correo {emailVerified ? "verificado" : "sin verificar"}</span>
      </div>
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          {!emailVerified && (
            <Button variant="ghost" size="sm" loading={busy === "verify"} onClick={() => void run("verify", () => platformResendVerification(userId), "Correo de verificación reenviado")}>
              Reenviar verificación de correo
            </Button>
          )}
          <Button variant="ghost" size="sm" loading={busy === "reset"} onClick={() => void run("reset", () => sendUserPasswordReset(userId), "Correo para restablecer la contraseña enviado")}>
            Enviar correo para restablecer la contraseña
          </Button>
        </div>
      )}
    </div>
  )
}
