"use client"

import { createContext, useContext } from "react"
import { areaPaths, type Area } from "@/lib/lms/roles"

// El shell de cada área (estudiante / instructor / administrador) declara en qué área está. Las pantallas
// compartidas (reproductor, evaluación, editor de cursos) usan esto para enlazar SOLO dentro de su área.
const AreaContext = createContext<Area>("student")

export const AreaProvider = AreaContext.Provider
export const useArea = (): Area => useContext(AreaContext)
export const usePaths = () => areaPaths(useContext(AreaContext))
