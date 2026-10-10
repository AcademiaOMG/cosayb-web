"use client"

import { playKeyDown, playKeyUp } from "@/lib/calculator/sound"

/** Props de puntero que hacen sonar la tecla al bajar y al soltar. */
export const keySoundProps = {
  onPointerDown: () => playKeyDown(),
  onPointerUp: () => playKeyUp(),
  onPointerLeave: (e: React.PointerEvent) => {
    if (e.buttons) playKeyUp()
  },
}
