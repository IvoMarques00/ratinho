import { passthroughEffect } from "./passthrough.js";
import type { EffectDefinition } from "../types.js";

export const EFFECTS: Record<string, EffectDefinition> = {
  [passthroughEffect.id]: passthroughEffect,
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
