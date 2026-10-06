/** El scroll de la app vive en <main> (ver AppShell), no en la ventana. */
export function scrollMainToTop() {
  if (typeof document === "undefined") return
  document.querySelector("main")?.scrollTo({ top: 0 })
}
