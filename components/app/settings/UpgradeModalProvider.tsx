"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface UpgradeModalContextType {
  isOpen: boolean
  highlightFeature?: string
  open: (feature?: string) => void
  close: () => void
}

const UpgradeModalContext = createContext<UpgradeModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
})

export function useUpgradeModal() {
  return useContext(UpgradeModalContext)
}

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightFeature, setHighlightFeature] = useState<string | undefined>()

  const open = useCallback((feature?: string) => {
    setHighlightFeature(feature)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setHighlightFeature(undefined)
  }, [])

  return (
    <UpgradeModalContext.Provider value={{ isOpen, highlightFeature, open, close }}>
      {children}
    </UpgradeModalContext.Provider>
  )
}
