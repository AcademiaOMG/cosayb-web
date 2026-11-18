"use client"

import { useRef, useState } from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { mutate as globalMutate } from "swr"
import Cover from "@/components/lms/art/Cover"
import { Button } from "@/components/lms/ui"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { lms } from "@/lib/lms/api"
import { lmsKeys } from "@/lib/lms/hooks"
import { COVER_MAX_BYTES, COVER_MIN, validateCoverFile } from "@/lib/lms/validation"
import { toast } from "@/lib/toast"
import type { AdminCourse } from "@/lib/lms/types"
import { errMsg } from "./kit"

/** Lee el tamaño real de la imagen en el navegador (el servidor lo vuelve a comprobar de forma independiente). */
function readSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo leer la imagen."))
    }
    img.src = url
  })
}

/** Portada propia del curso: sube, reemplaza o quita la imagen; sin imagen se usa la ilustración elegida. */
export default function CoverUploader({ course, onChanged }: { course: AdminCourse; onChanged: () => void }) {
  const confirm = useConfirm()
  const input = useRef<HTMLInputElement>(null)
  const [percent, setPercent] = useState<number | null>(null)
  const has = (course.coverVersion ?? 0) > 0

  async function pick(file: File | undefined) {
    if (!file) return
    const early = validateCoverFile({ type: file.type, size: file.size })
    if (early) return void toast.warning(early)
    try {
      const size = await readSize(file)
      const bad = validateCoverFile({ type: file.type, size: file.size, ...size })
      if (bad) return void toast.warning(bad)
    } catch (e) {
      return void toast.warning(errMsg(e))
    }
    setPercent(0)
    try {
      await lms.admin.setCover(course.id, file, setPercent)
      await Promise.all([globalMutate(lmsKeys.overview), globalMutate(lmsKeys.catalog)])
      onChanged()
      toast.success("Portada actualizada.")
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setPercent(null)
      if (input.current) input.current.value = ""
    }
  }

  async function remove() {
    if (!(await confirm({ title: "Quitar portada", description: "El curso volverá a mostrar la ilustración elegida.", itemName: course.title, variant: "danger" }))) return
    try {
      await lms.admin.removeCover(course.id)
      await Promise.all([globalMutate(lmsKeys.overview), globalMutate(lmsKeys.catalog)])
      onChanged()
      toast.success("Portada quitada.")
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  return (
    <div className="l-card p-5">
      <h2 className="font-extrabold">Portada del curso</h2>
      <div className="mt-3 overflow-hidden rounded-2xl" style={{ aspectRatio: "400 / 220" }}>
        <Cover coverKey={course.coverKey} slug={course.slug} coverVersion={course.coverVersion} className="block h-full w-full" />
      </div>
      <p className="l-hint mt-2">
        JPG, PNG o WebP, de {COVER_MIN.width}×{COVER_MIN.height} px o más y máximo {COVER_MAX_BYTES / 1024 / 1024} MB. Se recorta al centro para llenar la tarjeta (relación 16:9 recomendada).
      </p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Elegir imagen de portada" tabIndex={-1} onChange={(e) => void pick(e.target.files?.[0])} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => input.current?.click()} disabled={percent !== null}>
          <ImagePlus size={16} aria-hidden="true" /> {has ? "Cambiar imagen" : "Subir imagen"}
        </Button>
        {has && percent === null && (
          <Button variant="ghost" onClick={remove}>
            <Trash2 size={16} aria-hidden="true" /> Quitar
          </Button>
        )}
      </div>
      {percent !== null && (
        <div className="q-progress mt-3" role="progressbar" aria-label="Subiendo portada" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  )
}
