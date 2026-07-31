import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.d.ts"],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: [".claude/skills/**/*.mjs", "packages/render-core/scripts/**/*.mjs", "scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        fetch: "readonly",
        // page.evaluate() callback bodies in these driver scripts
        // genuinely reference browser globals that execute in-page.
        document: "readonly",
      },
    },
  },
  {
    // Playwright driver scripts: mostly Node, but page.evaluate() callback
    // bodies genuinely reference browser globals (window, document) that
    // execute in-page, not in this Node process.
    files: ["packages/render-core/test-e2e/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        window: "readonly",
        document: "readonly",
      },
    },
  },
);
