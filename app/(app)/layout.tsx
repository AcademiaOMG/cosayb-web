import type { Metadata } from "next"
import AppShell from "@/components/app/AppShell"
import { UpgradeModalProvider } from "@/components/app/settings/UpgradeModalProvider"
import UpgradeModal from "@/components/app/settings/UpgradeModal"
import BrandProvider from "@/components/branding/BrandProvider"
import PlatformPreviewBar from "@/components/branding/editor/PlatformPreviewBar"
import { getServerBranding } from "@/lib/branding/server"
import { brandingStyle } from "@/lib/branding/resolve"

// La app autenticada nunca se indexa
export const metadata: Metadata = { robots: { index: false, follow: false } }

// AppShell ya monta <SessionGuard /> internamente (components/app/AppShell.tsx) —
// no duplicarlo aquí: dos instancias en el mismo árbol compiten entre sí por el
// bloqueo de pestañas (cada una genera su propio tabId y se ven como "otra pestaña").
// app-theme-neutral: reemplaza los tokens de fondo/texto/borde beige del
// sistema global por blanco/gris claro, solo dentro de la app autenticada
// (no toca marketing, login, registro ni /plataforma). Ver definición de
// los tokens en globals.css.
//
// Marca blanca: el tema del negocio se inyecta como <style id="brand-theme">
// (`:root,.app-theme-neutral{...}`) en el HTML del servidor, después de las hojas
// globales, para ganar sobre .app-theme-neutral sin parpadeo. Al ser :root,
// los portales (Modal/Select) heredan igual. Sin marca/feature no se emite nada
// y la app queda idéntica a la de siempre. El LMS ((learn)/(instructor)) es la
// Academia OMG y no se personaliza.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const branding = await getServerBranding()
  const css = brandingStyle(branding)
  return (
    <>
      {css && <style id="brand-theme" dangerouslySetInnerHTML={{ __html: css }} />}
      <BrandProvider initial={branding}>
        <div className="app-theme-neutral">
          <UpgradeModalProvider>
            <AppShell>{children}</AppShell>
            <UpgradeModal />
            <PlatformPreviewBar />
          </UpgradeModalProvider>
        </div>
      </BrandProvider>
    </>
  )
}
