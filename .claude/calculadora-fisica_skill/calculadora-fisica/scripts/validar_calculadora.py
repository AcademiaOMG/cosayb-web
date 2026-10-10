#!/usr/bin/env python3
"""Revisa estáticamente que una calculadora HTML cumpla las reglas del skill calculadora-fisica.

Uso: python validar_calculadora.py ruta/calculadora.html
Salida: una línea OK/FALLO por regla. Código de salida 1 si hay algún fallo.
No reemplaza mirar el render: solo detecta lo que se puede comprobar en el código.
"""
import re
import sys


def main(ruta):
    with open(ruta, encoding="utf-8") as f:
        html = f.read()
    bajo = html.lower()

    # Contenido del LCD (de .glass hasta el cierre del bisel), sin etiquetas, para buscar textos prohibidos.
    m = re.search(r'class="glass".*?(?=<div class="row">|<div class="marg">|<div class="pad")', html, re.S)
    lcd = m.group(0) if m else ""

    reglas = [
        ("Tiene <title> con nombre", bool(re.search(r"<title>[^<]{3,}</title>", html))),
        ("Hueco de tecla (.slot) y pared lateral de la tecla", ".slot" in html and bool(re.search(r"0 3px 0 var\(--side", html))),
        ("Estado pulsado con translateY", bool(re.search(r"translateY\(3px\)", html))),
        ("Teclas deshabilitables y apagadas (:disabled)", ":disabled" in html),
        ("Dígitos de 7 segmentos en SVG (skewX + polygon)", "skewX(" in html and "<polygon" in html.replace("polygon class", "<polygon")),
        ("Segmentos apagados visibles (lcd-ghost)", "lcd-ghost" in html),
        ("Reflejo y sombra de bisel en el vidrio (.glass::after)", bool(re.search(r"\.glass::after", html))),
        ("Campos como recuadros con cursor y lápiz (.fld, .cur, .pen)", all(s in html for s in (".fld", ".cur", ".pen"))),
        ("Sacudida en campo faltante (@keyframes shake)", "@keyframes shake" in html),
        ("Región aria-live para mensajes", "aria-live" in html),
        ("Sin mensajes de texto dentro del LCD", "id=\"msg\"" not in lcd and 'class="msg"' not in lcd),
        ("Sin textos de estado prohibidos ('Pulsa Calcular', 'Seg.')", not re.search(r"Pulsa Calcular|Seg\. ?\+", html)),
        ("Sin 3D (Three.js / WebGL)", not re.search(r"three(\.js|\.min)|webglrenderer|@react-three", bajo)),
        ("Sin marcas reales (Casio, Texas, Sharp, Canon)", not re.search(r"\b(casio|texas instruments|sharp|canon)\b", bajo)),
        ("Tema claro y oscuro (prefers-color-scheme + data-theme)", "prefers-color-scheme" in html and 'data-theme="dark"' in html),
        ("Fondo del body desde un token", bool(re.search(r"body\{[^}]*background(-color)?:var\(--", html))),
        ("Respeta prefers-reduced-motion", "prefers-reduced-motion" in html),
        ("Sonido con Web Audio y interruptor", "AudioContext" in html and bool(re.search(r'id="snd"', html))),
        ("Teclado físico (keydown) y soltar (keyup)", "keydown" in html and "keyup" in html),
        ("Ancho responsive del aparato (min(100%, ...))", "min(100%" in html),
        ("Pestañas de modo fuera del aparato (role=tablist)", 'role="tablist"' in html),
        ("Sin teclas de modo dentro del aparato", not re.search(r'data-key="mode:', html)),
    ]

    fallos = 0
    for nombre, ok in reglas:
        print(("OK     " if ok else "FALLO  ") + nombre)
        if not ok:
            fallos += 1
    print("\n%d de %d reglas cumplidas." % (len(reglas) - fallos, len(reglas)))
    return 1 if fallos else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
