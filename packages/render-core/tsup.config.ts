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
  {
    entry: {
      "node-entry": "src/node-entry.ts",
    },
    // ESM only: this module uses import.meta.url for path resolution,
    // which is empty/broken under CJS require(). The "./node" export
    // subpath in package.json only declares an "import" condition to
    // match, so require()-ing this path fails at resolution time
    // instead of silently misbehaving at runtime.
    format: ["esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    target: "es2022",
    platform: "node",
    external: ["playwright-core"],
  },
]);
