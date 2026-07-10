"use client"

import { usePathname } from "next/navigation"

export default function TransitionWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return <div key={pathname}>{children}</div>
}
