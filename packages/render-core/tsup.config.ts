import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "gl-entry": "src/gl-entry.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: "es2022",
  },
  {
    entry: {
      harness: "src/harness/entry.ts",
    },
    format: ["iife"],
    globalName: "RatinhoRender",
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    target: "es2022",
    platform: "browser",
    noExternal: ["ani-core"],
  },
]);
