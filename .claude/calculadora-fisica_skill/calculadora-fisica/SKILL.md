---
name: calculadora-fisica
description: Diseña calculadoras y herramientas numéricas con teclado en pantalla como objetos físicos realistas, con carcasa con grosor, pantalla LCD de 7 segmentos, teclas que se hunden, sonido y campos de entrada claros. Usar siempre que se pida crear, rehacer o ajustar una calculadora, conversor o simulador de cálculo del software, o cuando se mencione una calculadora con estilo físico, skeuomórfico o tipo Casio.
---

# Calculadora física

Todas las calculadoras del software comparten un lenguaje: se ven y se sienten como una calculadora real de bolsillo, no como un formulario con sombras. Solo cambia el dominio (qué datos entran y qué se calcula). La interfaz del aparato se mantiene.

## Flujo de trabajo

1. **Definir el dominio.** Listar los modos (qué se puede calcular), los datos de cada modo y la fórmula. Los modos van como pestañas de la página, nunca como teclas dentro del aparato.
2. **Partir de la plantilla.** Copiar `assets/ejemplo-costeo.html` y cambiar solo los bloques marcados con `DOMINIO` (campos, modos, estado inicial, fórmulas, título). No reescribir carcasa, teclas, LCD ni sonido.
3. **Consultar según haga falta:**
   - Apariencia (carcasa, teclas, pantalla, tipografía): `references/diseno-visual.md`
   - Dígitos de 7 segmentos y formato de números: `references/lcd-segmentos.md`
   - Campos, validación, teclado físico y sonido: `references/experiencia.md`
4. **Validar.** Ejecutar `python scripts/validar_calculadora.py ruta/calculadora.html`. Debe terminar sin fallos. Es una revisión estática: no reemplaza mirar el resultado.
5. **Mirar el render** (captura en ancho de 430px y en escritorio, en tema claro y oscuro) y comprobar la lista de abajo antes de entregar.

## Reglas esenciales

- **Una sola luz**, arriba a la izquierda. Sombras proyectadas siempre negras con alfa, nunca de color.
- **Capas, no planos:** toda pieza tiene cara superior, pared lateral y sombra de contacto.
- **CSS + SVG únicamente.** Nada de Three.js ni WebGL: el aparato no gira y en 3D se ve como un juguete.
- **La pantalla casi no tiene texto:** una etiqueta pequeña de qué se calcula, el resultado grande y los campos. Sin mensajes de validación, fórmulas ni textos de ayuda.
- **Campos como recuadros:** uno por dato, lado a lado, con etiqueta. El activo lleva marco grueso y cursor parpadeante; los inactivos, un lápiz.
- **Validación sin texto:** el cursor salta al campo vacío y el recuadro se sacude. El mensaje escrito va solo en una región `aria-live` oculta.
- **Marca ficticia.** Nunca el nombre, logo ni tipografía de una marca real.
- **Ambos temas, 400px de ancho y teclado físico** deben funcionar.

## Lista final

- ¿Se ve un objeto con grosor y no una tarjeta?
- ¿El LCD tiene reflejo, sombra de bisel y segmentos apagados visibles?
- ¿En dos segundos se entiende qué campo está activo y que se puede tocar?
- ¿El LCD tiene solo etiqueta, números y campos?
- ¿Las teclas no disponibles se ven apagadas y deshabilitadas?
- ¿El validador pasó sin fallos?

## Qué evitar

Teclas planas con un solo `box-shadow` difuso; sombras o brillos de color; pestañas o títulos repetidos dentro del aparato; animaciones sin función; estados vacíos sin valores de ejemplo.
