# Pantalla LCD de 7 segmentos

Los dígitos se dibujan en SVG propio. No depender de la fuente DSEG: las fuentes externas pueden estar bloqueadas por la política de seguridad de la página.

## Geometría de una celda

Cada celda mide 28.5 de ancho por 54 de alto dentro de un paso de 34. Siete polígonos hexagonales:

```js
function hs(cy){return '3,'+cy+' 6,'+(cy-3)+' 22,'+(cy-3)+' 25,'+cy+' 22,'+(cy+3)+' 6,'+(cy+3)}
function vs(cx,y1,y2){return cx+','+y1+' '+(cx+3)+','+(y1+3)+' '+(cx+3)+','+(y2-3)+' '+cx+','+y2+' '+(cx-3)+','+(y2-3)+' '+(cx-3)+','+(y1+3)}
var P={a:hs(3.5),g:hs(24),d:hs(44.5),f:vs(2.5,5.5,22.5),b:vs(25.5,5.5,22.5),e:vs(2.5,25.5,42.5),c:vs(25.5,25.5,42.5)};
var MAP={'0':'abcdef','1':'bc','2':'abdeg','3':'abcdg','4':'bcfg','5':'acdfg','6':'acdefg','7':'abc','8':'abcdefg','9':'abcdfg','-':'g','E':'adefg','r':'eg','o':'cdeg',' ':''};
```

## Reglas de dibujo

- **Segmentos apagados siempre visibles** en `--lcd-ghost` (≈ 7% de la tinta). Es lo que hace que parezca LCD real y no texto.
- **Inclinación:** todo el grupo con `transform="translate(7 0) skewX(-7)"`; el `viewBox` mide `celdas*34+10` de ancho por 54 de alto.
- **Punto decimal por celda:** círculo en la esquina inferior derecha de cada celda, apagado salvo que corresponda. La coma añade una cola triangular.
- **Texto → celdas:** recorrer los caracteres; `.` y `,` no consumen celda, se adjuntan al dígito anterior. Rellenar con celdas vacías por la izquierda hasta el número fijo de celdas (alineación a la derecha).
- **Desborde:** si el texto no cabe, mostrar `Error` (E, r, r, o, r).
- **Valor vacío:** mostrar `0` atenuado (`.dim .s.on{fill-opacity:.4}`), no una pantalla en blanco.

## Formato de números (es-CO)

- Miles con punto, decimales con coma. Formatear a mano con `String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')` para no depender de ICU.
- Dinero sin decimales; porcentajes con coma y hasta dos decimales; resultados de porcentaje con un decimal.
- Número de celdas: 8 para el resultado, 7 para cada campo de entrada, 3 para ajustes pequeños (margen).
- Limitar la entrada por campo: máximo de dígitos para dinero; porcentaje entre 0 y 100 con 2 decimales.

## Tamaños

El contenedor define el tamaño, no el SVG: resultado ~250px de ancho, campos ~112px, mini pantalla ~46px. Con `width:100%; height:auto` el SVG escala por su `viewBox`.
