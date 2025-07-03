import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**/*",
      "src/generated/**/*",
      "node_modules/**/*",
      // --- additional ignore patterns migrated from legacy `.eslintignore` ---
      //
      // Build / output directories
      ".next/",          // framework output
      "out/",            // static export output
      "dist/",           // any compiled output

      // PWA-generated assets (produced by next-pwa / workbox)
      "public/sw.js",
      "public/workbox-*.js",
      "public/fallback-*.js",

      // Test files (Jest/Vitest testing files)
      "**/__tests__/**/*",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.test.js",
      "**/*.test.jsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/*.spec.js",
      "**/*.spec.jsx",
      "jest.config.js",
      "jest.setup.js",

      // Environment & configuration artefacts
      ".env*",          // all env files (.env, .env.local, etc.)

      // IDE folders
      ".vscode/",
      ".idea/",

      "*.js",
      "*.mjs",
      "*.cjs"
    ]
  }
];

export default eslintConfig;
