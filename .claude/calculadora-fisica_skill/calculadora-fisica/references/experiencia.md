# Experiencia de uso

La interfaz visual manda, pero ninguna decisión visual puede hacer dudar al usuario de qué tocar. Estas reglas salieron de pruebas con usuarios y no se negocian.

## Qué va dentro del aparato y qué fuera

- **Fuera (la página, con el sistema de diseño del software):** título, pestañas de modo ("qué quieres calcular"), notas.
- **Dentro:** marca ficticia y celda solar, LCD, selectores auxiliares (por ejemplo, recetas), ajuste con teclas − / +, teclado numérico y la tecla de acción.
- Las pestañas ya existen en la app: no se duplican como teclas.

## Campos del LCD

- Un recuadro por dato, **lado a lado**, con la etiqueta arriba. Nunca filas apiladas sin borde: un usuario novato no entiende que debe tocar la de arriba o la de abajo.
- **Activo:** marco grueso, fondo algo más oscuro y **cursor parpadeante** a la derecha del número.
- **Inactivo:** borde fino e **ícono de lápiz** junto a la etiqueta, para indicar que se puede tocar.
- Cada recuadro es un `<button>` con `aria-pressed`, tocable y alcanzable con teclado.
- Con el campo vacío se muestra un `0` atenuado.

## Validación sin texto en pantalla

- La pantalla no muestra mensajes, fórmulas ni textos de estado ("Falta...", "Pulsa Calcular", "Seg. +3 %").
- Si se pulsa la tecla de acción con un dato faltante, el cursor salta al primer campo vacío y ese recuadro se sacude (`translateX` ~5px, 0.3s).
- El mensaje escrito va solo en una región `aria-live="polite"` oculta visualmente, para lectores de pantalla.

## Comportamiento

- Teclas no disponibles según el campo activo (coma en campos de dinero entero, `000` en porcentajes): deshabilitadas y apagadas.
- Al cambiar de modo, el resultado del modo anterior pasa como dato al nuevo, de modo que ir y volver da el mismo valor.
- Al editar cualquier dato, el resultado se borra para no mostrar un valor desactualizado.
- Abrir siempre con valores de ejemplo ya calculados. "Limpiar" los borra.
- Selectores auxiliares (recetas): se deshabilitan si el dato que cargan es la salida del modo actual.

## Teclado físico

Dígitos, coma o punto, Retroceso, Supr/Esc (limpiar), Enter (calcular), ↑ ↓ (cambiar de campo). La tecla en pantalla se hunde mientras se pulsa la del teclado (clase `.down`). No interceptar Enter ni Espacio si el foco está en un botón o en un `select`. Para que el clic con ratón no deje el foco en la tecla, usar `mousedown` con `preventDefault()`.

## Sonido

Sintetizado con Web Audio, sin archivos:

- **Al bajar la tecla:** ráfaga de ruido de ~30ms filtrada con paso de banda (~2.3 kHz) y un golpe grave (oscilador de 190 a 70 Hz en 50ms).
- **Al soltar:** solo ruido más agudo (~3.7 kHz) y más suave.
- Interruptor visible "Sonido activado/apagado" con `aria-pressed`. El `AudioContext` se crea en el primer gesto del usuario.

## Accesibilidad y movimiento

- Foco visible en teclas (anillo en el hueco), campos y pestañas.
- Pestañas con `role="tablist"`, `aria-selected` y flechas ← → para moverse.
- `prefers-reduced-motion`: sin sacudida, sin parpadeo del cursor y sin transiciones de tecla.
