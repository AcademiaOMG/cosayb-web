/**
 * Estilos del panel. Las clases `console-*` se mantienen por compatibilidad con las páginas
 * existentes, pero con el diseño nuevo (tema neutro, vidrio sutil, radios y sombras de la app).
 * Prefijo `plat-` = piezas del shell.
 */
const CSS = `
.console-card {
  background:
    radial-gradient(circle at 12% 8%, var(--glass-tint) 0%, transparent 62%),
    var(--bg-surface);
  -webkit-backdrop-filter: var(--glass-filter);
  backdrop-filter: var(--glass-filter);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
}
.console-title { color: var(--text-primary); }
.console-muted { color: var(--text-muted); }
.console-accent { color: var(--accent); }
.console-input {
  background: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.console-input::placeholder { color: var(--text-muted); }
.console-input:hover { border-color: var(--text-muted); }
.console-input:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}
.console-row {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.console-row:hover {
  border-color: var(--border-medium);
  box-shadow: var(--shadow-md);
}

/* Foco visible para enlaces/botones del panel */
.plat-focus:focus-visible,
.plat-link:focus-visible,
.plat-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Navegación lateral (fondo oscuro, como la de la app) */
.plat-nav-link {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 500; color: #A9B6CC;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.plat-nav-link:hover { background: rgba(255,255,255,0.08); color: #fff; }
.plat-nav-link[aria-current="page"] { background: var(--accent); color: #fff; }
.plat-nav-link:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
.plat-nav-group { padding: 0 12px; margin-bottom: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #8497B4; }

/* Botones de la barra superior */
.plat-btn {
  display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 12px;
  border: 1px solid var(--border-light); border-radius: var(--radius-sm);
  background: var(--bg-surface); color: var(--text-primary);
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.plat-btn:hover { background: var(--bg-secondary); border-color: var(--border-medium); }

.plat-drawer-panel { animation: plat-in 200ms ease-out; }
.plat-drawer-backdrop { animation: plat-fade 200ms ease-out; }
@keyframes plat-in { from { transform: translateX(-24px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes plat-fade { from { opacity: 0 } to { opacity: 1 } }
@media (prefers-reduced-motion: reduce) {
  .plat-drawer-panel, .plat-drawer-backdrop, .plat-nav-link, .console-input, .console-row { animation: none; transition: none; }
}
`

export default function PlatformStyles() {
  return <style>{CSS}</style>
}
