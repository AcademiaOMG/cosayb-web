// ─── Sonido de las teclas de la calculadora ─────────────────────────────────
// Sintetizado con Web Audio (sin archivos). Al bajar: ráfaga corta de ruido
// filtrada + un golpe grave. Al soltar: solo ruido más agudo y suave.
// El AudioContext se crea en el primer gesto del usuario. La preferencia se
// guarda en localStorage (si está bloqueado, simplemente no persiste).

import { getCalcSkin } from "./skin"

const STORAGE_KEY = "calc-sound"

let enabled = true
let loaded = false
let ctx: AudioContext | null = null
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) !== "off"
  } catch {
    /* sin almacenamiento: queda activado */
  }
}

export function subscribeSound(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function getSoundOn() {
  load()
  return enabled
}

export function setSoundOn(on: boolean) {
  load()
  enabled = on
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off")
  } catch {
    /* ignorar */
  }
  listeners.forEach((l) => l())
}

function audio() {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

function noise(c: AudioContext, duration: number, freq: number, gain: number) {
  const len = Math.floor(c.sampleRate * duration)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const band = c.createBiquadFilter()
  band.type = "bandpass"
  band.frequency.value = freq
  band.Q.value = 1.1
  const g = c.createGain()
  g.gain.value = gain
  src.connect(band).connect(g).connect(c.destination)
  src.start()
}

export function playKeyDown() {
  load()
  if (!enabled || getCalcSkin() !== "blue") return
  const c = audio()
  if (!c) return
  noise(c, 0.03, 2300, 0.35)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.frequency.setValueAtTime(190, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(70, c.currentTime + 0.05)
  g.gain.setValueAtTime(0.22, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06)
  osc.connect(g).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.07)
}

export function playKeyUp() {
  load()
  if (!enabled || getCalcSkin() !== "blue") return
  const c = audio()
  if (!c) return
  noise(c, 0.02, 3700, 0.16)
}
