/** Descarga un texto como archivo CSV desde el navegador. */
export function descargarCsv(nombreArchivo: string, contenido: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function fechaParaArchivo(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}
