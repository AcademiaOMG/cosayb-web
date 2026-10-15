// Contenido del centro de ayuda. Texto plano (sin JSX) para poder buscarlo,
// probarlo y reutilizarlo en el JSON-LD de FAQPage.

export type FaqCategoryId = "primeros-pasos" | "cuenta" | "planes" | "calculos" | "equipo" | "datos"

export const FAQ_CATEGORIES: { id: FaqCategoryId; label: string }[] = [
  { id: "primeros-pasos", label: "Primeros pasos" },
  { id: "cuenta", label: "Cuenta y acceso" },
  { id: "planes", label: "Planes y pagos" },
  { id: "calculos", label: "Costos y cálculos" },
  { id: "equipo", label: "Equipo y roles" },
  { id: "datos", label: "Datos y privacidad" },
]

export interface FaqEntry {
  id: string
  category: FaqCategoryId
  q: string
  a: string
}

export const FAQ: FaqEntry[] = [
  {
    id: "primer-resultado",
    category: "primeros-pasos",
    q: "¿Cómo obtengo mi primer costo de receta?",
    a: "Crea tu negocio, registra tus ingredientes con su precio en Inventario y luego crea una receta en Recetas. Al agregar los ingredientes verás el costo total y por porción al instante.",
  },
  {
    id: "orden-modulos",
    category: "primeros-pasos",
    q: "¿En qué orden conviene usar los módulos?",
    a: "Inventario (ingredientes) → Factor de rendimiento (mermas) → Recetas → Menús → Valoración y Punto de equilibrio para fijar precios. La lista de pasos del panel te guía hasta tu primer resultado.",
  },
  {
    id: "importar-ingredientes",
    category: "primeros-pasos",
    q: "¿Puedo importar mis ingredientes desde Excel?",
    a: "Sí. En Inventario usa la opción de importar y sigue la plantilla. También puedes empezar con el banco de ingredientes y recetas base incluido en los planes de pago.",
  },
  {
    id: "olvide-clave",
    category: "cuenta",
    q: "Olvidé mi contraseña, ¿cómo la recupero?",
    a: "En la pantalla de inicio de sesión pulsa «¿Olvidaste tu contraseña?», escribe tu correo y te enviaremos un enlace válido por 1 hora para crear una nueva.",
  },
  {
    id: "verificar-correo",
    category: "cuenta",
    q: "No me llegó el correo de verificación",
    a: "Revisa la carpeta de spam. Puedes pedir otro desde la pantalla de inicio de sesión («Reenviar correo») o desde Mi cuenta > Seguridad. Si sigue sin llegar, escríbenos desde el formulario de soporte.",
  },
  {
    id: "cambiar-correo",
    category: "cuenta",
    q: "¿Cómo cambio mi correo o mi contraseña?",
    a: "Entra a Mi cuenta > Seguridad. Para el correo te enviaremos un enlace de confirmación; al cambiar la contraseña cerramos tus otras sesiones por seguridad.",
  },
  {
    id: "sesiones",
    category: "cuenta",
    q: "¿Cómo cierro sesión en otros dispositivos?",
    a: "En Mi cuenta > Seguridad verás tus sesiones activas y podrás cerrarlas. También puedes usar «Cerrar sesión en todos los dispositivos» en la pestaña Cuenta.",
  },
  {
    id: "prueba",
    category: "planes",
    q: "¿Cómo funciona la prueba gratuita?",
    a: "Al crear tu negocio tienes 14 días con funciones Pro, sin tarjeta. Al terminar pasas al plan Free con funciones limitadas, a menos que elijas un plan de pago.",
  },
  {
    id: "cambiar-plan",
    category: "planes",
    q: "¿Cómo subo o bajo de plan?",
    a: "Desde Configuración > Facturación. Al subir pagas el valor completo del plan nuevo y empieza un periodo de 30 días. Al bajar, conservas tu plan hasta el final del periodo ya pagado.",
  },
  {
    id: "cancelar",
    category: "planes",
    q: "¿Cómo cancelo mi suscripción?",
    a: "En Configuración > Facturación pulsa «Cancelar suscripción». Seguirás usando tu plan hasta el final del periodo pagado y puedes reanudarla antes de que termine.",
  },
  {
    id: "pago-fallido",
    category: "planes",
    q: "Mi pago falló, ¿qué hago?",
    a: "Verás un aviso en la plataforma. Actualiza tu método de pago en Configuración > Facturación y reintenta el cobro. Tienes 5 días antes de pasar al plan Free; tus datos no se borran.",
  },
  {
    id: "facturas",
    category: "planes",
    q: "¿Dónde descargo mis facturas y recibos?",
    a: "En Configuración > Facturación > Historial de facturas. Abre un recibo y usa «Imprimir / PDF» para guardarlo.",
  },
  {
    id: "reembolso",
    category: "planes",
    q: "¿Puedo pedir un reembolso?",
    a: "El primer cobro de un plan de pago es reembolsable dentro de los 7 días siguientes. Consulta la política de reembolso y escríbenos desde el formulario de soporte con el número de tu recibo.",
  },
  {
    id: "costo-porcion",
    category: "calculos",
    q: "¿Cómo se calcula el costo por porción?",
    a: "Sumamos el costo de cada ingrediente (precio por unidad × cantidad, ajustado por el factor de rendimiento) y lo dividimos entre las porciones de la receta.",
  },
  {
    id: "factor-rendimiento",
    category: "calculos",
    q: "¿Qué es el factor de rendimiento?",
    a: "Es el porcentaje aprovechable de un ingrediente después de limpiarlo o cocinarlo (mermas). Con él, el costo de la receta refleja lo que realmente pagas por lo que usas.",
  },
  {
    id: "precio-venta",
    category: "calculos",
    q: "¿Cómo defino el precio de venta de un plato?",
    a: "Usa Valoración: ingresas tu porcentaje de costo objetivo y obtienes el precio sugerido. Con Punto de equilibrio calculas cuántas ventas necesitas para cubrir tus costos fijos.",
  },
  {
    id: "invitar",
    category: "equipo",
    q: "¿Cómo invito a mi equipo?",
    a: "En Configuración > Equipo envía una invitación por correo con el rol que corresponda. La persona acepta el enlace y queda en tu organización. El número de usuarios depende de tu plan.",
  },
  {
    id: "roles",
    category: "equipo",
    q: "¿Qué puede hacer cada rol?",
    a: "Propietario y gerente administran el negocio; chef y analista de costos trabajan con recetas, inventario y cálculos; solo lectura puede consultar. En planes de pago puedes crear roles personalizados en Configuración > Roles.",
  },
  {
    id: "exportar",
    category: "datos",
    q: "¿Puedo exportar mis datos?",
    a: "Sí. En Mi cuenta > Cuenta pulsa «Exportar mis datos» para descargar un archivo JSON con tus ingredientes, recetas, menús y cálculos.",
  },
  {
    id: "eliminar-cuenta",
    category: "datos",
    q: "¿Cómo elimino mi cuenta?",
    a: "En Mi cuenta > Cuenta > Zona de riesgo. Si eres propietario de un negocio con equipo, primero transfiere la propiedad o elimina la organización. Tus datos se borran en un máximo de 30 días.",
  },
  {
    id: "privacidad",
    category: "datos",
    q: "¿Qué hacen con mis datos?",
    a: "Solo los usamos para prestarte el servicio, la facturación y el soporte. No vendemos datos. Más detalle en la política de privacidad.",
  },
]

/** Minúsculas y sin tildes, para comparar. */
export function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
}

/** Filtra por categoría y por texto (todas las palabras deben aparecer en pregunta o respuesta). */
export function filterFaq(query: string, category: FaqCategoryId | "all" = "all", entries: FaqEntry[] = FAQ): FaqEntry[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean)
  return entries.filter((e) => {
    if (category !== "all" && e.category !== category) return false
    if (!terms.length) return true
    const hay = normalizeText(`${e.q} ${e.a}`)
    return terms.every((t) => hay.includes(t))
  })
}
