# Diseño visual

Todo parte de una luz única arriba a la izquierda. Los brillos van arriba/izquierda; las sombras, abajo/derecha. Los valores exactos están en `assets/ejemplo-costeo.html`; aquí está la lógica para poder adaptarlos.

## Tokens

Definirlos una vez en `:root`. El aparato es igual en tema claro y oscuro; solo cambia la mesa (fondo de la página), que usa sus propios tokens con la estructura `:root` + `@media (prefers-color-scheme: dark)` + `:root[data-theme="dark"]`.

| Grupo | Tokens | Uso |
|---|---|---|
| Carcasa | `--body-hi`, `--body-mid`, `--body-lo`, `--body-edge`, `--body-lip` | degradado diagonal, filete y labio de grosor |
| Impresión | `--print`, `--print-hi` | etiquetas grabadas sobre la carcasa |
| Teclas numéricas | `--k-top`, `--k-bot`, `--k-side`, `--k-side2`, `--k-ink` | marfil |
| Teclas de función | `--f-*` | azul acero |
| Tecla de acción | `--c-*` | cobalto, ancha, abajo |
| Hueco de tecla | `--well` | casi negro |
| Pantalla | `--lcd-1`, `--lcd-2`, `--lcd-ink`, `--lcd-ghost` | verde grisáceo, tinta, segmento apagado |

Si el sistema de diseño del software pide otra paleta, se cambian los tokens; la estructura de capas no se toca.

## Carcasa

- `border-radius` ~28px y degradado diagonal entre `--body-hi` y `--body-lo`.
- Brillo superior: `linear-gradient` blanco al 11% que se apaga hacia el 13% de la altura.
- Grano de plástico: ruido SVG (`feTurbulence`) como data URI al 7% de opacidad.
- `box-shadow` apilado, en este orden: luz interior superior, sombra interior inferior, filete exterior de 1px, labio de 5 a 6px de grosor en dos tonos, sombra de suelo larga y negra.
- `::after` con un reflejo diagonal muy tenue, `pointer-events:none`.
- Encabezado del aparato: marca ficticia en cursiva condensada y celda solar (rectángulo oscuro con líneas verticales tenues y brillo diagonal).

## Pantalla

1. **Bisel:** pozo hundido (`inset` oscuro) con filete claro abajo.
2. **Vidrio:** degradado verde, `inset` de sombra arriba y a la izquierda (la que proyecta el bisel), reflejo diagonal blanco con `::after`.
3. **Dígitos:** `filter: drop-shadow(1.3px 1.9px 0 rgba(tinta,.2))` para el paralaje de un LCD real.
4. **Campos de entrada:** recuadros dentro del vidrio (ver `experiencia.md`).

## Teclas

Cada tecla vive en un hueco:

```css
.slot{border-radius:13px;background:var(--well);padding:2px 2px 7px;overflow:hidden;
  box-shadow:inset 0 2px 4px rgba(0,0,0,.95),0 1px 0 rgba(255,255,255,.11)}
.key{height:46px;border-radius:11px;
  background:radial-gradient(90% 70% at 50% 16%,rgba(255,255,255,.55),transparent 70%),linear-gradient(180deg,var(--top),var(--bot));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.85),inset 0 -3px 4px rgba(0,0,0,.14),
    inset 0 0 0 1px rgba(0,0,0,.12),0 3px 0 var(--side),0 5px 0 var(--side2)}
.key:active,.key.down{transform:translateY(3px);
  box-shadow:inset 0 2px 5px rgba(0,0,0,.28),0 0 0 var(--side),0 2px 0 var(--side2)}
```

- El `overflow:hidden` del hueco recorta la pared lateral dentro del agujero. Por eso el anillo de foco va en el hueco: `.slot:has(.key:focus-visible)`.
- Tecla deshabilitada: `filter:saturate(.25) brightness(.62)` y `disabled`.
- Rejilla de 4 columnas: dígitos, retroceso, limpiar, coma, `0` y `000` a doble ancho, y la tecla de acción a ancho completo.

## Tipografía

- **Barlow** (500 a 700) para números y teclas.
- **Barlow Condensed** (600, 700 y cursiva 700) para marca, etiquetas impresas y etiquetas del LCD.
- Etiquetas impresas: mayúsculas, `letter-spacing` ~.15em y `text-shadow:0 -1px 0 rgba(0,0,0,.55)` para el grabado.
- Si el entorno bloquea fuentes externas, declarar siempre una pila de respaldo (`'Arial Narrow'`, `Arial`, `sans-serif`).

## Responsive

Ancho `min(100%, 380px)`, margen lateral mínimo de 16px, sin scroll horizontal. Los SVG de dígitos escalan con `width:100%; height:auto`.
