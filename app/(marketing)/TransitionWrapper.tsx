"use client"

import { usePathname } from "next/navigation"

export default function TransitionWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="animate-spacex">
      {children}
    </div>
  )
}
