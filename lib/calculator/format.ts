// Formatos de resultado de las calculadoras (es-CO).

/** "$ 25.000" — pesos sin decimales */
export const formatCOP = (n: number) => `$ ${Math.round(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`

/** "$ 16,04" — pesos con decimales (costos por gramo) */
export const formatCOPDecimals = (n: number, decimals = 2) =>
  `$ ${n.toLocaleString("es-CO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`

/** "337,7" */
export const formatNumber = (n: number, decimals = 1) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: decimals })

/** "64,41 %" */
export const formatPercent = (n: number, decimals = 1) =>
  `${n.toLocaleString("es-CO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`
