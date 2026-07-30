import { describe, expect, it } from "vitest";
import { buildFragmentSource } from "../src/glsl/assemble.js";
import { findPossiblyUndeclaredUniforms, lintPhaseUsage } from "../src/glsl/lint.js";
import type { PlannedPass } from "../src/plan.js";
import type { EffectDefinition } from "../src/types.js";

function makePass(overrides: Partial<PlannedPass> = {}): PlannedPass {
  return {
    name: "main",
    fragment: "fragColor = texture(uSource, vUv);",
    inputs: [{ uniform: "uSource", bufferName: "source" }],
    outputBuffer: "output",
    format: "rgba8",
    blend: "none",
    passIndex: 0,
    ...overrides,
  };
}

function makeEffect(overrides: Partial<EffectDefinition> = {}): EffectDefinition {
  return {
    id: "fx",
    label: "Fx",
    description: "",
    padding: 0.2,
    schema: {},
    passes: () => [],
    ...overrides,
  };
}

describe("buildFragmentSource", () => {
  it("includes the shared prelude and wraps the body in main()", () => {
    const source = buildFragmentSource(makeEffect(), makePass());
    expect(source).toContain("#version 300 es");
    expect(source).toContain("in vec2 vUv;");
    expect(source).toContain("void main() {");
    expect(source).toContain("fragColor = texture(uSource, vUv);");
  });

  it("declares a sampler2D for every pass input", () => {
    const source = buildFragmentSource(
      makeEffect(),
      makePass({ inputs: [{ uniform: "uA", bufferName: "x" }, { uniform: "uB", bufferName: "y" }] }),
    );
    expect(source).toContain("uniform sampler2D uA;");
    expect(source).toContain("uniform sampler2D uB;");
  });

  it("declares effect schema uniforms with the correct GLSL type and default glslName", () => {
    const effect = makeEffect({
      schema: {
        intensity: { type: "float", label: "Intensity", default: 1, min: 0, max: 2 },
        tint: { type: "color", label: "Tint", default: [1, 1, 1, 1] },
        mode: { type: "enum", label: "Mode", default: "a", options: [{ value: "a", label: "A" }] },
      },
    });
    const source = buildFragmentSource(effect, makePass());
    expect(source).toContain("uniform float uIntensity;");
    expect(source).toContain("uniform vec4 uTint;");
    expect(source).toContain("uniform int uMode;");
  });

  it("respects a custom glslName override", () => {
    const effect = makeEffect({
      schema: { angle: { type: "float", label: "Angle", default: 0, min: 0, max: 1, glslName: "uCustomAngle" } },
    });
    const source = buildFragmentSource(effect, makePass());
    expect(source).toContain("uniform float uCustomAngle;");
    expect(source).not.toContain("uniform float uAngle;");
  });

  it("only inlines stdlib chunks the fragment body actually references", () => {
    const withRot = buildFragmentSource(makeEffect(), makePass({ fragment: "vec2 p = rot2(1.0) * vUv;" }));
    expect(withRot).toContain("mat2 rot2(float a)");
    expect(withRot).not.toContain("float luma(vec3 c)");

    const withoutAny = buildFragmentSource(makeEffect(), makePass({ fragment: "fragColor = vec4(0.0);" }));
    expect(withoutAny).not.toContain("mat2 rot2(float a)");
  });
});

describe("findPossiblyUndeclaredUniforms", () => {
  it("finds nothing wrong in a correctly-assembled source", () => {
    const source = buildFragmentSource(makeEffect(), makePass({ fragment: "fragColor = texture(uSource, vUv) * uPhase;" }));
    expect(findPossiblyUndeclaredUniforms(source)).toEqual([]);
  });

  it("catches a typo'd uniform name used but never declared", () => {
    const source = buildFragmentSource(makeEffect(), makePass({ fragment: "fragColor = vec4(uPhaes);" }));
    expect(findPossiblyUndeclaredUniforms(source)).toContain("uPhaes");
  });
});

describe("lintPhaseUsage", () => {
  it("allows TAU * <k> * uPhase", () => {
    expect(lintPhaseUsage("float a = TAU * 2.0 * uPhase;")).toEqual([]);
  });

  it("allows fract(...uPhase...)", () => {
    expect(lintPhaseUsage("float u = fract(cycles * uPhase);")).toEqual([]);
  });

  it("flags a bare, non-periodic use of uPhase", () => {
    const issues = lintPhaseUsage("float y = uPhase * 100.0;");
    expect(issues.length).toBeGreaterThan(0);
  });
});
