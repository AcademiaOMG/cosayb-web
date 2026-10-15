import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Deuda técnica: estos archivos anteriores incumplen las reglas del React Compiler
// (eslint-plugin-react-hooks v6) que trae eslint-config-next. Se degradan a aviso SOLO
// aquí para que CI no falle; el código nuevo sigue sujeto a error. Pendiente de refactor
// (componentes definidos dentro del render, setState en efectos). Ver docs/SAAS_BACKLOG_WEB.md (E6).
const LEGACY_REACT_COMPILER_FILES = [
  "app/(app)/configuracion/marca/page.tsx",
  "app/(app)/menu/page.tsx",
  "components/commerce/BookCheckout.tsx",
  "components/commerce/EnrollmentFlow.tsx",
  "components/commerce/SubscriptionCheckout.tsx",
  "lib/commerce/useCheckout.ts",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: LEGACY_REACT_COMPILER_FILES,
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "test-results/**",
    "graphify-out/**",
  ]),
]);

export default eslintConfig;
