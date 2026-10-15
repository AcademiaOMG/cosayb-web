"use client"

import { useRef, useState } from "react"
import { Upload, FileDown } from "lucide-react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { bancoCreateIngredient, bancoUpdateIngredient } from "@/lib/api"
import { friendlyError } from "@/lib/errorMessage"
import type { Ingrediente } from "@/types/domain"
import { construirCsv, resumenImportacion, validarImportacionIngredientes, type FilaImportacion, type ResultadoImportacion } from "@/lib/plataforma/banco/csv"
import { ejecutarEnLote } from "@/lib/plataforma/banco/lote"
import { formatCOP } from "@/components/app/inventario/format"
import { descargarCsv } from "./descargar"
import { Aviso } from "./BancoTable"

const MAX_BYTES = 2 * 1024 * 1024

const ETIQUETA: Record<FilaImportacion["accion"], { texto: string; tono: "warning" | "danger" | "muted" | "ok" }> = {
  crear: { texto: "Se creará", tono: "ok" },
  actualizar: { texto: "Se actualizará el precio", tono: "warning" },
  sin_cambios: { texto: "Sin cambios", tono: "muted" },
  error: { texto: "Con error", tono: "danger" },
}

export default function ImportarIngredientesModal({
  abierto,
  existentes,
  onClose,
  onTerminado,
}: {
  abierto: boolean
  existentes: Ingrediente[]
  onClose: () => void
  onTerminado: (r: { creados: number; actualizados: number; fallidos: number }) => void
}) {
  return (
    <Modal open={abierto} onClose={onClose} title="Importar ingredientes desde CSV" wide>
      {abierto && <Contenido existentes={existentes} onClose={onClose} onTerminado={onTerminado} />}
    </Modal>
  )
}

function Contenido({
  existentes,
  onClose,
  onTerminado,
}: {
  existentes: Ingrediente[]
  onClose: () => void
  onTerminado: (r: { creados: number; actualizados: number; fallidos: number }) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [errorLectura, setErrorLectura] = useState<string | null>(null)
  const [aplicando, setAplicando] = useState<{ hechos: number; total: number } | null>(null)
  const [informe, setInforme] = useState<{ creados: number; actualizados: number; fallos: { fila: number; nombre: string; motivo: string }[] } | null>(null)

  async function elegir(f: File | undefined) {
    setErrorLectura(null)
    setResultado(null)
    if (!f) return
    if (f.size > MAX_BYTES) { setErrorLectura("El archivo pesa más de 2 MB. Divídelo en partes más pequeñas."); return }
    try {
      const texto = await f.text()
      setArchivo(f.name)
      setResultado(validarImportacionIngredientes(texto, existentes))
    } catch {
      setErrorLectura("No se pudo leer el archivo. Asegúrate de que sea un CSV de texto.")
    }
  }

  function plantilla() {
    descargarCsv(
      "plantilla-ingredientes-banco.csv",
      construirCsv(["nombre", "costo", "peso_gramos"], [["Harina de trigo", 5000, 1000], ["Aceite de canola", 14500, 1500]])
    )
  }

  const resumen = resultado ? resumenImportacion(resultado.filas) : null
  const aplicables = resultado?.filas.filter((f) => f.accion === "crear" || f.accion === "actualizar") ?? []

  async function aplicar() {
    if (aplicables.length === 0) return
    setAplicando({ hechos: 0, total: aplicables.length })
    const r = await ejecutarEnLote(
      aplicables,
      (f) =>
        f.accion === "actualizar" && f.existenteId
          ? bancoUpdateIngredient(f.existenteId, { costPerUnit: f.costo!, weightGrams: f.peso! })
          : bancoCreateIngredient({ name: f.nombre, costPerUnit: f.costo!, weightGrams: f.peso! }),
      (hechos, total) => setAplicando({ hechos, total }),
      (e) => friendlyError(e, "No se pudo guardar.")
    )
    setAplicando(null)
    setInforme({
      creados: r.hechos.filter((f) => f.accion === "crear").length,
      actualizados: r.hechos.filter((f) => f.accion === "actualizar").length,
      fallos: r.fallidos.map((x) => ({ fila: x.item.fila, nombre: x.item.nombre, motivo: x.motivo })),
    })
  }

  // ── Paso 3: informe final ──
  if (informe) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>
          Listo: <strong>{informe.creados}</strong> {informe.creados === 1 ? "ingrediente creado" : "ingredientes creados"} y{" "}
          <strong>{informe.actualizados}</strong> {informe.actualizados === 1 ? "actualizado" : "actualizados"}.
        </p>
        {informe.fallos.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>
              {informe.fallos.length} {informe.fallos.length === 1 ? "fila no se pudo guardar" : "filas no se pudieron guardar"}
            </p>
            <ul className="max-h-48 overflow-auto rounded-lg p-3 text-xs" style={{ background: "var(--bg-secondary)" }}>
              {informe.fallos.map((f) => (
                <li key={f.fila}>Fila {f.fila} · {f.nombre}: {f.motivo}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={() => { onTerminado({ creados: informe.creados, actualizados: informe.actualizados, fallidos: informe.fallos.length }); onClose() }}>
            Cerrar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        <p>
          Sube un archivo CSV con las columnas <strong>nombre</strong>, <strong>costo</strong> y <strong>peso_gramos</strong>.
          Antes de guardar nada verás una vista previa con los errores fila por fila.
        </p>
        <p className="mt-1.5">
          Si el nombre ya existe en el banco, se actualiza su precio; si no, se crea.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,text/csv"
          className="sr-only"
          aria-label="Archivo CSV de ingredientes"
          onChange={(e) => { void elegir(e.target.files?.[0]); e.target.value = "" }}
        />
        <Button variant="primary" onClick={() => inputRef.current?.click()} disabled={!!aplicando}>
          <Upload size={15} aria-hidden="true" /> {archivo ? "Elegir otro archivo" : "Elegir archivo"}
        </Button>
        <Button variant="ghost" onClick={plantilla}>
          <FileDown size={15} aria-hidden="true" /> Descargar plantilla
        </Button>
        {archivo && <span className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{archivo}</span>}
      </div>

      {errorLectura && <p role="alert" className="text-sm" style={{ color: "var(--error)" }}>{errorLectura}</p>}
      {resultado?.errorArchivo && <p role="alert" className="text-sm" style={{ color: "var(--error)" }}>{resultado.errorArchivo}</p>}

      {resultado && !resultado.errorArchivo && resumen && (
        <>
          <p className="text-sm" style={{ color: "var(--text-primary)" }} aria-live="polite">
            <strong>{resumen.crear}</strong> por crear · <strong>{resumen.actualizar}</strong> por actualizar ·{" "}
            <strong>{resumen.sin_cambios}</strong> sin cambios ·{" "}
            <strong style={{ color: resumen.error ? "var(--error)" : undefined }}>{resumen.error}</strong> con error
          </p>

          <div className="max-h-72 overflow-auto rounded-xl" style={{ border: "1px solid var(--border-light)" }}>
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                <tr>
                  <th className="px-3 py-2 font-semibold">Fila</th>
                  <th className="px-3 py-2 font-semibold">Ingrediente</th>
                  <th className="px-3 py-2 text-right font-semibold">Costo</th>
                  <th className="px-3 py-2 text-right font-semibold">Peso</th>
                  <th className="px-3 py-2 font-semibold">Qué pasará</th>
                </tr>
              </thead>
              <tbody>
                {resultado.filas.map((f) => {
                  const e = ETIQUETA[f.accion]
                  return (
                    <tr key={f.fila} className="align-top" style={{ borderTop: "1px solid var(--border-light)" }}>
                      <td className="px-3 py-2 tabular-nums">{f.fila}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>{f.nombre || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{f.costo === null ? "—" : formatCOP(f.costo)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{f.peso === null ? "—" : `${f.peso.toLocaleString("es-CO")} g`}</td>
                      <td className="px-3 py-2">
                        {e.tono === "ok" ? (
                          <span className="inline-flex rounded-md px-1.5 py-px text-[11px] font-semibold" style={{ background: "#DCFCE7", color: "#166534" }}>{e.texto}</span>
                        ) : (
                          <Aviso tono={e.tono}>{e.texto}</Aviso>
                        )}
                        {f.errores.map((m) => (
                          <p key={m} className="mt-1" style={{ color: "var(--error)" }}>{m}</p>
                        ))}
                        {f.avisos.map((m) => (
                          <p key={m} className="mt-1" style={{ color: "#B45309" }}>{m}</p>
                        ))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {resumen.error > 0 && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Las filas con error no se guardarán. Corrígelas en el archivo y súbelo de nuevo, o aplica solo las válidas.
            </p>
          )}
          {resumen.actualizar > 0 && (
            <p className="text-xs" style={{ color: "#B45309" }}>
              Se cambiará el precio de {resumen.actualizar} {resumen.actualizar === 1 ? "ingrediente existente" : "ingredientes existentes"}; las recetas que los usan cambiarán de costo.
            </p>
          )}
        </>
      )}

      {aplicando && (
        <div aria-live="polite" className="flex flex-col gap-1.5">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Guardando {aplicando.hechos} de {aplicando.total}…</p>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border-light)" }} role="progressbar" aria-valuenow={aplicando.hechos} aria-valuemin={0} aria-valuemax={aplicando.total}>
            <div className="h-1.5 rounded-full" style={{ width: `${(aplicando.hechos / aplicando.total) * 100}%`, background: "var(--accent)", transition: "width 0.2s" }} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2.5 pt-1">
        <Button variant="ghost" onClick={onClose} disabled={!!aplicando}>Cancelar</Button>
        <Button variant="primary" onClick={() => void aplicar()} disabled={aplicables.length === 0 || !!aplicando} loading={!!aplicando}>
          {aplicables.length === 0 ? "Nada que aplicar" : `Aplicar ${aplicables.length} ${aplicables.length === 1 ? "cambio" : "cambios"}`}
        </Button>
      </div>
    </div>
  )
}
