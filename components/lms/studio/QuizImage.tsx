"use client"

import useSWR from "swr"
import { ImageOff } from "lucide-react"
import { lms } from "@/lib/lms/api"

/** Imagen privada de una pregunta o respuesta: se pide una URL temporal (5 min) y se renueva sola antes de vencer. */
export default function QuizImage({ id, admin, alt, className = "", style }: { id: string | null | undefined; admin?: boolean; alt: string; className?: string; style?: React.CSSProperties }) {
  const { data, error } = useSWR(
    id ? `lms/media/${admin ? "a" : "s"}/${id}` : null,
    () => (admin ? lms.admin.mediaAccess(id!) : lms.quizMediaAccess(id!)),
    { revalidateOnFocus: false, refreshInterval: 240_000, dedupingInterval: 60_000 }
  )
  if (!id) return null
  if (error) {
    return (
      <span role="img" aria-label={`${alt} (no disponible)`} className={`flex items-center justify-center ${className}`} style={{ background: "var(--l-bg)", color: "var(--l-muted)", ...style }}>
        <ImageOff size={20} aria-hidden="true" />
      </span>
    )
  }
  if (!data) return <span aria-hidden="true" className={`l-skeleton block ${className}`} style={style} />
  // eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal del API: next/image no aplica
  return <img src={data.url} alt={alt} loading="lazy" className={className} style={style} />
}
