// Kit de calculadora física reutilizable: el aparato, su pantalla, los
// datos de entrada y el teclado. La lógica de entrada (pura) vive en
// @/lib/calculator/entry.
export { default as CalcDevice } from "./CalcDevice"
export { default as CalcDisplay, type CalcDisplayTone } from "./CalcDisplay"
export { default as CalcRegister, type CalcRegisterProps } from "./CalcRegister"
export { default as CalcKeypad } from "./CalcKeypad"
export { default as CalcActionKey } from "./CalcActionKey"
export { default as SegText } from "./SegText"
export { useCalcRegisters } from "./useCalcRegisters"
export { default as CalcPanel, type CalcPanelField } from "./CalcPanel"
export { useSolverCalculator, type SolverOutcome, type SolverCalculator } from "./useSolverCalculator"
export { default as CalcBreakdown } from "./CalcBreakdown"
export { default as CalcViewShell } from "./CalcViewShell"
export { default as CalcModal } from "./CalcModal"
export { scrollMainToTop } from "./scrollMainToTop"
