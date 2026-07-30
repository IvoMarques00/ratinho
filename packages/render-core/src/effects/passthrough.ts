import type { EffectDefinition } from "../types.js";

/**
 * Identity effect: copies the ingested source straight to output. No
 * creative value on its own — it's the known-answer fixture that proves
 * the full upload -> ingest -> pass -> FBO -> readback -> flip round trip
 * before any real shader effect exists, and the minimal example for
 * authoring a new effect.
 */
export const passthroughEffect: EffectDefinition = {
  id: "passthrough",
  label: "Passthrough (debug)",
  description: "Copies the source image through unmodified. Used for pipeline self-tests.",
  padding: 0,
  schema: {},
  passes: () => [
    {
      name: "copy",
      fragment: `fragColor = texture(uSource, vUv);`,
      inputs: [{ uniform: "uSource", from: "source" }],
      output: { target: "output" },
    },
  ],
};
