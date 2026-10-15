import PlatformShell from "@/components/plataforma/PlatformShell"

// Consola de la plataforma: shell propio (rutas y navegación por sub-rol) con el mismo
// diseño que la app autenticada. app-theme-neutral aplica los tokens neutros (ver globals.css).
export default function PlataformaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-theme-neutral">
      <PlatformShell>{children}</PlatformShell>
    </div>
  )
}
