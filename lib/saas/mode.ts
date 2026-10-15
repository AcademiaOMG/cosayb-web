export type SaasMode = "mock" | "real"

/**
 * `NEXT_PUBLIC_SAAS_MODE` explícito manda. Si falta, producción usa el API real: un despliegue
 * que olvide la variable no debe mostrar a los clientes una facturación simulada del navegador.
 */
export function resolveSaasMode(value: string | undefined, nodeEnv: string | undefined): SaasMode {
  if (value === "real" || value === "mock") return value
  return nodeEnv === "production" ? "real" : "mock"
}
