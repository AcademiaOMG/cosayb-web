"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FileText } from "lucide-react"
import Button from "@/components/ui/Button"
import { toast } from "@/lib/toast"
import { lms } from "@/lib/lms/api"
import { formatBytes } from "@/lib/lms/validation"
import type { LessonAsset } from "@/lib/lms/types"

/** Cuerpo de la lección: SIEMPRE texto escapado (React), nunca HTML. Respeta saltos de línea. */
export function LessonBody({ body }: { body: string }) {
  if (!body.trim()) return null
  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-primary)" }}>
      {body}
    </div>
  )
}

/**
 * Reproductor. La URL del video es temporal y la emite el servidor tras comprobar tu acceso;
 * si caduca durante la reproducción se pide una nueva y se continúa donde ibas.
 */
export function VideoPlayer({ lessonId, video, subtitles }: { lessonId: string; video: LessonAsset; subtitles: LessonAsset[] }) {
  const ref = useRef<HTMLVideoElement>(null)
  const resumeAt = useRef(0)
  const [src, setSrc] = useState<string | null>(null)
  const [tracks, setTracks] = useState<string[]>([])
  const [failed, setFailed] = useState(false)
  const retries = useRef(0)

  const load = useCallback(async () => {
    try {
      const a = await lms.assetAccess(lessonId, video.id)
      setSrc(a.url)
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [lessonId, video.id])

  useEffect(() => {
    let alive = true
    retries.current = 0
    lms
      .assetAccess(lessonId, video.id)
      .then((a) => alive && setSrc(a.url))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [lessonId, video.id])

  useEffect(() => {
    let alive = true
    Promise.all(subtitles.map((s) => lms.assetAccess(lessonId, s.id).then((a) => a.url)))
      .then((urls) => alive && setTracks(urls))
      .catch(() => alive && setTracks([]))
    return () => {
      alive = false
    }
  }, [lessonId, subtitles])

  if (failed) {
    return (
      <div className="rounded-xl p-6 text-center text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }} role="alert">
        No pudimos cargar el video.{" "}
        <button type="button" className="underline" onClick={() => void load()}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <video
      ref={ref}
      key={video.id}
      src={src ?? undefined}
      controls
      playsInline
      preload="metadata"
      crossOrigin="anonymous"
      className="aspect-video w-full rounded-xl bg-black"
      onLoadedMetadata={() => {
        if (resumeAt.current > 0 && ref.current) ref.current.currentTime = resumeAt.current
      }}
      onError={() => {
        // El enlace temporal pudo vencer: se renueva (máx. 3 veces) y se retoma la posición.
        if (retries.current >= 3) return setFailed(true)
        retries.current += 1
        resumeAt.current = ref.current?.currentTime ?? 0
        void load()
      }}
    >
      {tracks.map((t, i) => (
        <track key={t} kind="subtitles" src={t} srcLang="es" label="Español" default={i === 0} />
      ))}
    </video>
  )
}

export function DocumentButton({ lessonId, asset, index }: { lessonId: string; asset: LessonAsset; index: number }) {
  const [busy, setBusy] = useState(false)
  async function open() {
    setBusy(true)
    try {
      const a = await lms.assetAccess(lessonId, asset.id)
      const link = document.createElement("a")
      link.href = a.url
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.click()
    } catch {
      toast.error("No pudimos abrir el documento. Inténtalo de nuevo.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button variant="ghost" size="sm" onClick={open} loading={busy} className="justify-start">
      <FileText size={16} aria-hidden="true" /> Documento {index + 1} (PDF, {formatBytes(asset.sizeBytes)})
    </Button>
  )
}
