"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { ImageIcon, Trash2, Upload } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import { ASSET_ACCEPTED_TYPES, ASSET_KINDS, ASSET_LABELS, validateAssetFile } from "@/lib/branding/draft"
import { assetUrl, deleteBrandAsset, uploadBrandAsset } from "@/lib/branding/editorApi"
import type { BrandAssetKind, BrandingResponse } from "@/lib/branding/types"

interface SlotProps {
  kind: BrandAssetKind
  url: string | null
  version: number
  locked: boolean
  onChanged: () => Promise<unknown>
}

function LogoSlot({ kind, url, version, locked, onChanged }: SlotProps) {
  const uid = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const meta = ASSET_LABELS[kind]

  const localUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl)
    }
  }, [localUrl])

  function pick(f: File | undefined) {
    if (!f) return
    const problem = validateAssetFile(f)
    setError(problem)
    setFile(problem ? null : f)
    if (inputRef.current) inputRef.current.value = ""
  }

  function cancel() {
    setFile(null)
    setError(null)
  }

  async function upload() {
    if (!file || locked) return
    setBusy(true)
    try {
      await uploadBrandAsset(kind, file)
      await onChanged()
      toast.success(`${meta.title} actualizado`)
      cancel()
    } catch (err) {
      setError(friendlyError(err, "No se pudo subir el archivo."))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (locked) return
    const ok = await confirm({
      title: `Eliminar ${meta.title.toLowerCase()}`,
      description: "Se volverá a usar el logotipo por defecto.",
      variant: "danger",
    })
    if (!ok) return
    setBusy(true)
    try {
      await deleteBrandAsset(kind)
      await onChanged()
      toast.success(`${meta.title} eliminado`)
    } catch (err) {
      toast.error("No se pudo eliminar", { description: friendlyError(err, "Inténtalo de nuevo.") })
    } finally {
      setBusy(false)
    }
  }

  const shown = localUrl ?? assetUrl(url, version)

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[var(--radius-md)] border p-4" style={{ borderColor: "var(--border-light)" }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{meta.title}</p>
        <p id={`${uid}-hint`} className="text-xs" style={{ color: "var(--text-muted)" }}>{meta.hint}</p>
      </div>

      <div
        className="flex h-24 items-center justify-center overflow-hidden rounded-[var(--radius-sm)]"
        style={{ background: "var(--bg-secondary)" }}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo del negocio (URL del API o blob local)
          <img src={shown} alt={`Vista previa de ${meta.title.toLowerCase()}`} className="max-h-20 max-w-[85%] object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
            <ImageIcon size={20} aria-hidden /> Sin archivo
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        id={`${uid}-file`}
        type="file"
        accept={ASSET_ACCEPTED_TYPES.join(",")}
        className="sr-only"
        disabled={locked || busy}
        aria-describedby={`${uid}-hint`}
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {error && (
        <p role="alert" className="text-xs font-medium" style={{ color: "var(--error-text)" }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {file ? (
          <>
            <Button size="sm" loading={busy} disabled={locked} onClick={upload}>
              Guardar archivo
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={cancel}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" disabled={locked || busy} onClick={() => inputRef.current?.click()}>
              <Upload size={14} aria-hidden /> {url ? "Reemplazar" : "Subir"}
            </Button>
            {url && (
              <Button size="sm" variant="ghost" disabled={locked || busy} onClick={remove} aria-label={`Eliminar ${meta.title.toLowerCase()}`}>
                <Trash2 size={14} aria-hidden /> Eliminar
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface Props {
  assets: BrandingResponse["assets"]
  version: number
  locked: boolean
  onChanged: () => Promise<unknown>
}

export default function LogosSection({ assets, version, locked, onChanged }: Props) {
  return (
    <Card>
      <h2 className="mb-1 text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
        LOGOTIPOS
      </h2>
      <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        PNG, JPG, WebP o SVG de hasta 1 MB. Los archivos se guardan al instante, sin esperar al botón Guardar.
      </p>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
        {ASSET_KINDS.map((k) => (
          <LogoSlot key={k} kind={k} url={assets?.[k] ?? null} version={version} locked={locked} onChanged={onChanged} />
        ))}
      </div>
    </Card>
  )
}
