import { redirect } from "next/navigation"

// /ajustes fue dividido en /cuenta (perfil personal) y /configuracion/* (negocio)
export default function AjustesRedirect() {
  redirect("/cuenta")
}
