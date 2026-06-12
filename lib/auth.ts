import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/auth`, // Esto es lo que permite que el frontend "pegue" la cookie al backend
  fetchOptions: {
    credentials: "include",
  },
});
