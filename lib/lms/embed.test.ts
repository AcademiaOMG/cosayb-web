import { describe, expect, it } from "vitest"
import { embedSrc, embedWatchUrl, isValidEmbed, looksLikeVideoUrl } from "./embed"

describe("embeds de video", () => {
  it("arma el iframe solo con proveedor e ID válidos", () => {
    expect(embedSrc({ provider: "youtube", id: "UrQu7cdrNVY" })).toBe("https://www.youtube-nocookie.com/embed/UrQu7cdrNVY?rel=0&modestbranding=1&hl=es&cc_lang_pref=es")
    expect(embedSrc({ provider: "vimeo", id: "76979871" })).toBe("https://player.vimeo.com/video/76979871?dnt=1")
  })
  it("rechaza IDs con caracteres de inyección o proveedores desconocidos", () => {
    for (const e of [
      { provider: "youtube", id: 'UrQu7cdrNVY"onload="x' },
      { provider: "youtube", id: "../../evil" },
      { provider: "youtube", id: "javascript:alert(1)" },
      { provider: "vimeo", id: "abc" },
      { provider: "evil", id: "UrQu7cdrNVY" },
      { provider: "youtube" },
      null,
    ]) {
      expect(isValidEmbed(e as never)).toBe(false)
      expect(embedSrc(e as never)).toBeNull()
    }
  })
  it("enlace de respaldo", () => {
    expect(embedWatchUrl({ provider: "youtube", id: "UrQu7cdrNVY" })).toBe("https://www.youtube.com/watch?v=UrQu7cdrNVY")
  })
  it("validación del formulario", () => {
    expect(looksLikeVideoUrl("https://youtu.be/UrQu7cdrNVY")).toBe(true)
    expect(looksLikeVideoUrl("https://vimeo.com/76979871")).toBe(true)
    expect(looksLikeVideoUrl("http://youtu.be/UrQu7cdrNVY")).toBe(false)
    expect(looksLikeVideoUrl("https://evil.com/UrQu7cdrNVY")).toBe(false)
    expect(looksLikeVideoUrl("https://youtube.com.evil.com/x")).toBe(false)
  })
})
