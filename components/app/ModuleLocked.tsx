"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

const DEFAULT_MESSAGE = "Este módulo no está disponible en tu plan actual."

export default function ModuleLocked({ message }: { message?: string | null }) {
  return (
    <Card className="flex flex-col items-center text-center gap-3 py-10">
      <Lock size={28} style={{ color: "var(--text-muted)" }} />
      <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
        {message || DEFAULT_MESSAGE}
      </p>
      <Link href="/configuracion/membresia">
        <Button variant="primary" size="sm">Ver planes</Button>
      </Link>
    </Card>
  )
}
