import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Sin baseURL: better-auth infiere /api/auth en el mismo dominio (app.academiaomg.com)
  // Las llamadas van por el proxy de Next.js → las cookies se setean en el dominio correcto
  fetchOptions: {
    credentials: "include",
  },
});
