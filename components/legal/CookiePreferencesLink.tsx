"use client"

import { openCookiePreferences } from "@/lib/consent"

export default function CookiePreferencesLink({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={openCookiePreferences} className={className}>
      {children ?? "Preferencias de cookies"}
    </button>
  )
}
