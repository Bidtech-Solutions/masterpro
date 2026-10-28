import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      // Akses API hanya lewat src/lib/api (AGENTS.md §2.5)
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Gunakan src/lib/api/* untuk memanggil API." },
      ],
    },
  },
  {
    files: ["src/lib/api/**", "src/app/internal/**", "**/*.test.ts", "src/app/llms*/**"],
    rules: { "no-restricted-globals": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);
