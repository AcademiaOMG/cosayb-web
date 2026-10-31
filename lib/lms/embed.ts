// Videos externos incrustados (YouTube / Vimeo). El iframe se arma SOLO con provider + id validados:
// nunca se usa una URL escrita por un instructor como `src`.

export type EmbedProvider = "youtube" | "vimeo"
export interface Embed {
  provider: EmbedProvider
  id: string
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/
const VIMEO_ID = /^\d{6,12}$/

export function isValidEmbed(e: { provider?: string; id?: string } | null | undefined): e is Embed {
  if (!e || typeof e.id !== "string") return false
  return (e.provider === "youtube" && YT_ID.test(e.id)) || (e.provider === "vimeo" && VIMEO_ID.test(e.id))
}

/** URL del iframe (dominios sin cookies de seguimiento hasta que la persona reproduce). null si el embed no es válido. */
export function embedSrc(e: { provider?: string; id?: string } | null | undefined): string | null {
  if (!isValidEmbed(e)) return null
  return e.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${e.id}?rel=0&modestbranding=1&hl=es&cc_lang_pref=es`
    : `https://player.vimeo.com/video/${e.id}?dnt=1`
}

/** Enlace de respaldo para abrir el video en su sitio si no carga el reproductor incrustado. */
export function embedWatchUrl(e: Embed): string {
  return e.provider === "youtube" ? `https://www.youtube.com/watch?v=${e.id}` : `https://vimeo.com/${e.id}`
}

/** Mismo criterio de la API para validar en el formulario del instructor (la API vuelve a validar). */
export function looksLikeVideoUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== "https:") return false
    return /^(www\.|m\.)?(youtube\.com|youtube-nocookie\.com|vimeo\.com)$|^youtu\.be$|^player\.vimeo\.com$/i.test(u.hostname)
  } catch {
    return false
  }
}
