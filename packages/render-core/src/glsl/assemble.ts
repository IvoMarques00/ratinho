import { defaultGlslName } from "../schema.js";
import type { PlannedPass } from "../plan.js";
import type { EffectDefinition, UniformType } from "../types.js";
import { GLSL_LIB } from "./lib.js";
import { FRAGMENT_PRELUDE } from "./prelude.js";

function uniformGlslType(type: UniformType): string {
  switch (type) {
    case "float":
      return "float";
    case "int":
      return "int";
    case "bool":
      return "bool";
    case "color":
      return "vec4";
    case "vec2":
      return "vec2";
    case "enum":
      return "int";
  }
}

/**
 * Assembles one pass's full GLSL ES 3.00 fragment shader: prelude
 * (version/precision/built-ins) + this pass's sampler2D input
 * declarations + the effect's schema uniform declarations + any
 * referenced stdlib chunks + the pass's own body wrapped in main().
 */
export function buildFragmentSource(effect: EffectDefinition, pass: PlannedPass): string {
  const parts: string[] = [FRAGMENT_PRELUDE];

  for (const input of pass.inputs) {
    parts.push(`uniform sampler2D ${input.uniform};\n`);
  }

  for (const [key, spec] of Object.entries(effect.schema)) {
    const glslName = spec.glslName ?? defaultGlslName(key);
    parts.push(`uniform ${uniformGlslType(spec.type)} ${glslName};\n`);
  }

  for (const [name, chunk] of Object.entries(GLSL_LIB)) {
    if (new RegExp(`\\b${name}\\b`).test(pass.fragment)) {
      parts.push(chunk);
    }
  }

  parts.push(`void main() {\n${pass.fragment}\n}\n`);

  return parts.join("");
}
