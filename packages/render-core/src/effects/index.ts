import { bloomPulseEffect } from "./bloomPulse.js";
import { duotoneDriftEffect } from "./duotoneDrift.js";
import { grainStormEffect } from "./grainStorm.js";
import { passthroughEffect } from "./passthrough.js";
import { prismSpinEffect } from "./prismSpin.js";
import { shockwavePingEffect } from "./shockwavePing.js";
import { vortexSwirlEffect } from "./vortexSwirl.js";
import type { EffectDefinition } from "../types.js";

export const EFFECTS: Record<string, EffectDefinition> = {
  [passthroughEffect.id]: passthroughEffect,
  [bloomPulseEffect.id]: bloomPulseEffect,
  [prismSpinEffect.id]: prismSpinEffect,
  [vortexSwirlEffect.id]: vortexSwirlEffect,
  [shockwavePingEffect.id]: shockwavePingEffect,
  [grainStormEffect.id]: grainStormEffect,
  [duotoneDriftEffect.id]: duotoneDriftEffect,
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
export { vortexSwirlEffect } from "./vortexSwirl.js";
export { shockwavePingEffect } from "./shockwavePing.js";
export { grainStormEffect } from "./grainStorm.js";
export { duotoneDriftEffect } from "./duotoneDrift.js";
