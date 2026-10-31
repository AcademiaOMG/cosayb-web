"use client"

import { useParams } from "next/navigation"
import VerifyPanel from "@/components/lms/VerifyPanel"
import { safeDecode } from "@/lib/lms/validation"

export default function VerificarCodigoPage() {
  const { code } = useParams<{ code: string }>()
  return <VerifyPanel initialCode={safeDecode(code)} />
}
