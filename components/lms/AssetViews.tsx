"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ExternalLink, FileText, Film } from "lucide-react"
import { toast } from "@/lib/toast"
import { lms } from "@/lib/lms/api"
import { parseMarkdown, type Block, type Inline } from "@/lib/lms/markdown"
import { formatBytes } from "@/lib/lms/validation"
import { embedSrc, embedWatchUrl, isValidEmbed } from "@/lib/lms/embed"
import type { LessonAsset } from "@/lib/lms/types"
import { Button } from "./ui"

function Inl({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => (n.t === "strong" ? <strong key={i}>{n.v}</strong> : n.t === "code" ? <code key={i}>{n.v}</code> : <span key={i}>{n.v}</span>))}
    </>
  )
}

function Blk({ b }: { b: Block }) {
  switch (b.t) {
    case "h2": return <h2><Inl nodes={b.c} /></h2>
    case "h3": return <h3><Inl nodes={b.c} /></h3>
    case "quote": return <blockquote><Inl nodes={b.c} /></blockquote>
    case "ul": return <ul>{b.items.map((it, i) => <li key={i}><Inl nodes={it} /></li>)}</ul>
    case "ol": return <ol>{b.items.map((it, i) => <li key={i}><Inl nodes={it} /></li>)}</ol>
    case "hr": return <hr />
    case "img": return (
      <figure>
        {/* Solo rutas propias /lms-art/ (las valida el parser); el texto alternativo describe el diagrama. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.src} alt={b.alt} loading="lazy" decoding="async" />
        {b.alt && <figcaption>{b.alt}</figcaption>}
      </figure>
    )
    case "table": return (
      <div className="l-table-wrap" role="region" tabIndex={0} aria-label="Tabla (desliza para ver más columnas)">
        <table>
          <thead><tr>{b.head.map((h, i) => <th key={i} scope="col" style={{ textAlign: b.align[i] }}><Inl nodes={h} /></th>)}</tr></thead>
          <tbody>{b.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} style={{ textAlign: b.align[ci] }}><Inl nodes={c} /></td>)}</tr>)}</tbody>
        </table>
      </div>
    )
    default: return <p><Inl nodes={b.c} /></p>
  }
}

/** Cuerpo de la lección: mini-markdown propio que produce elementos React (texto escapado), nunca HTML crudo. */
export function LessonBody({ body }: { body: string }) {
  const blocks = useMemo(() => parseMarkdown(body), [body])
  if (!blocks.length) return null
  return <div className="l-prose">{blocks.map((b, i) => <Blk key={i} b={b} />)}</div>
}

/**
 * Video externo (YouTube/Vimeo). El iframe se arma solo con proveedor + ID validados (nunca con una URL libre),
 * en un sandbox mínimo. Si el reproductor no carga, queda el enlace al sitio del video.
 */
export function ExternalVideo({ embed, title }: { embed: { provider?: string; id?: string } | null | undefined; title: string }) {
  const src = embedSrc(embed)
  if (!src || !isValidEmbed(embed)) return null
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-[0_24px_50px_rgba(18,33,58,.25)]">
        <iframe
          src={src}
          title={`Video: ${title}`}
          className="h-full w-full border-0"
          loading="lazy"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
      <a href={embedWatchUrl(embed)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start text-sm font-bold" style={{ color: "var(--l-brand)" }}>
        <ExternalLink size={14} aria-hidden="true" /> ¿No carga el video? Ábrelo en {embed.provider === "youtube" ? "YouTube" : "Vimeo"}
      </a>
    </div>
  )
}

/**
 * Reproductor. La URL del video es temporal y la emite el servidor tras comprobar tu acceso;
 * si caduca durante la reproducción se pide una nueva y se continúa donde ibas.
 * Usa los controles nativos del navegador (accesibles por teclado) y pistas de subtítulos VTT.
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
    lms.assetAccess(lessonId, video.id).then((a) => alive && setSrc(a.url)).catch(() => alive && setFailed(true))
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
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-3xl text-center text-sm" style={{ background: "var(--bg-inverse)", color: "#fff" }} role="alert">
        <Film size={32} aria-hidden="true" />
        <p>No pudimos cargar el video.</p>
        <Button variant="soft" size="sm" onClick={() => void load()}>Reintentar</Button>
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
      aria-label="Video de la lección"
      className="aspect-video w-full rounded-3xl bg-black shadow-[0_24px_50px_rgba(18,33,58,.25)]"
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
    <button type="button" onClick={open} disabled={busy} className="l-card l-card-hover flex w-full items-center gap-3 p-4 text-left">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: "var(--l-rose)" }} aria-hidden="true"><FileText size={20} /></span>
      <span className="min-w-0 flex-1"><span className="block font-extrabold">Documento {index + 1}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{asset.mime === "application/pdf" ? "PDF" : asset.mime === "text/csv" ? "CSV" : asset.mime.includes("spreadsheetml") ? "Excel (XLSX)" : "Archivo"} · {formatBytes(asset.sizeBytes)}</span></span>
      <span className="l-btn l-btn-soft l-btn-sm">{busy ? "Abriendo…" : "Abrir"}</span>
    </button>
  )
}
