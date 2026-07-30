import { bloomPulseEffect } from "./bloomPulse.js";
import { passthroughEffect } from "./passthrough.js";
import { prismSpinEffect } from "./prismSpin.js";
import type { EffectDefinition } from "../types.js";

export const EFFECTS: Record<string, EffectDefinition> = {
  [passthroughEffect.id]: passthroughEffect,
  [bloomPulseEffect.id]: bloomPulseEffect,
  [prismSpinEffect.id]: prismSpinEffect,
};

export function listEffects(): EffectDefinition[] {
  return Object.values(EFFECTS);
}

export function getEffect(id: string): EffectDefinition {
  const effect = EFFECTS[id];
  if (!effect) {
    throw new Error(`Unknown effect "${id}". Available: ${Object.keys(EFFECTS).join(", ")}`);
  }
  return effect;
}

export { passthroughEffect } from "./passthrough.js";
export { bloomPulseEffect } from "./bloomPulse.js";
export { prismSpinEffect } from "./prismSpin.js";
