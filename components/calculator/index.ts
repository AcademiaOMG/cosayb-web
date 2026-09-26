// Kit de calculadora física reutilizable: el aparato, su pantalla, los
// datos de entrada y el teclado. La lógica de entrada (pura) vive en
// @/lib/calculator/entry.
export { default as CalcDevice } from "./CalcDevice"
export { default as CalcDisplay, type CalcDisplayTone } from "./CalcDisplay"
export { default as CalcRegister, type CalcRegisterProps } from "./CalcRegister"
export { default as CalcKeypad } from "./CalcKeypad"
export { useCalcRegisters } from "./useCalcRegisters"
