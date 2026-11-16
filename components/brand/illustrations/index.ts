import { createElement, type ComponentType } from "react"
import Balance from "./Balance"
import Calculator from "./Calculator"
import Gauge from "./Gauge"
import Gear from "./Gear"
import Inventory from "./Inventory"
import Menu from "./Menu"
import Recipe from "./Recipe"
import User from "./User"
import type { IllustrationProps } from "./kit"

export type { IllustrationProps }
export { Balance, Calculator, Gauge, Gear, Inventory, Menu, Recipe, User }

/** Claves de módulo = las 8 tarjetas de «¿Qué quieres revisar?». */
export type ModuleKey =
  | "inventory"
  | "yield"
  | "recipes"
  | "menu"
  | "valuation"
  | "breakeven"
  | "settings"
  | "account"

export const MODULE_ILLUSTRATIONS: Record<ModuleKey, ComponentType<IllustrationProps>> = {
  inventory: Inventory,
  yield: Gauge,
  recipes: Recipe,
  menu: Menu,
  valuation: Calculator,
  breakeven: Balance,
  settings: Gear,
  account: User,
}

export interface ModuleIllustrationProps extends IllustrationProps {
  module: ModuleKey
}

/** Ilustración SVG de un módulo; colores desde --ill-* (derivados de la marca). */
export function ModuleIllustration({ module, ...rest }: ModuleIllustrationProps) {
  return createElement(MODULE_ILLUSTRATIONS[module], rest)
}
