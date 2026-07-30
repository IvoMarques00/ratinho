import { describe, expect, it } from "vitest";
import { planPasses } from "../src/plan.js";
import type { EffectDefinition, PassSpec } from "../src/types.js";

function makeEffect(passes: PassSpec[], overrides: Partial<EffectDefinition> = {}): EffectDefinition {
  return {
    id: "test-effect",
    label: "Test",
    description: "",
    padding: 0.2,
    schema: {},
    passes: () => passes,
    ...overrides,
  };
}

describe("planPasses", () => {
  it("always includes a 'source' buffer sized to canvasSize, format rgba16f", () => {
    const effect = makeEffect([{ name: "copy", fragment: "", inputs: [{ uniform: "uSource", from: "source" }], output: { target: "output" } }]);
    const plan = planPasses(effect, {}, 256);
    const source = plan.buffers.find((b) => b.name === "source")!;
    expect(source).toEqual({ name: "source", width: 256, height: 256, format: "rgba16f" });
  });

  it("resolves a linear multi-pass chain via 'previous' and applies scale to buffer size", () => {
    const effect = makeEffect([
      { name: "threshold", fragment: "x", inputs: [{ uniform: "uSource", from: "source" }], output: { target: "bright", scale: 0.5 } },
      { name: "blurH", fragment: "x", inputs: [{ uniform: "uTex", from: "previous" }], output: { target: "blurred", scale: 0.5 } },
      { name: "composite", fragment: "x", inputs: [{ uniform: "uSource", from: "source" }, { uniform: "uBloom", from: "previous" }], output: { target: "output" } },
    ]);
    const plan = planPasses(effect, {}, 256);

    expect(plan.passes.map((p) => p.name)).toEqual(["threshold", "blurH", "composite"]);
    expect(plan.buffers.find((b) => b.name === "bright")).toMatchObject({ width: 128, height: 128, format: "rgba16f" });

    const blurH = plan.passes.find((p) => p.name === "blurH")!;
    expect(blurH.inputs).toEqual([{ uniform: "uTex", bufferName: "bright" }]);

    const composite = plan.passes.find((p) => p.name === "composite")!;
    expect(composite.inputs).toEqual([
      { uniform: "uSource", bufferName: "source" },
      { uniform: "uBloom", bufferName: "blurred" },
    ]);
    expect(composite.format).toBe("rgba8");
    expect(composite.outputBuffer).toBe("output");
  });

  it("throws if the last pass does not write to 'output'", () => {
    const effect = makeEffect([{ name: "only", fragment: "", inputs: [], output: { target: "notOutput" } }]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/must write to output.target "output"/);
  });

  it("throws if a non-last pass writes to 'output'", () => {
    const effect = makeEffect([
      { name: "first", fragment: "", inputs: [], output: { target: "output" } },
      { name: "second", fragment: "", inputs: [{ uniform: "u", from: "previous" }], output: { target: "output" } },
    ]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/only the last pass may write to "output"/);
  });

  it("throws if the final pass declares a non-rgba8 format", () => {
    const effect = makeEffect([{ name: "only", fragment: "", inputs: [], output: { target: "output" }, format: "rgba16f" }]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/must use format "rgba8"/);
  });

  it("throws when an input references a buffer that hasn't been produced yet", () => {
    const effect = makeEffect([{ name: "only", fragment: "", inputs: [{ uniform: "u", from: "neverProduced" }], output: { target: "output" } }]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/has not been produced/);
  });

  it("throws when 'previous' is used on the first pass", () => {
    const effect = makeEffect([{ name: "only", fragment: "", inputs: [{ uniform: "u", from: "previous" }], output: { target: "output" } }]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/is the first pass/);
  });

  it("throws when a pass reads the same buffer it writes to", () => {
    const effect = makeEffect([
      { name: "seed", fragment: "", inputs: [], output: { target: "buf" } },
      { name: "selfRead", fragment: "", inputs: [{ uniform: "u", from: "buf" }], output: { target: "buf" } },
      { name: "final", fragment: "", inputs: [{ uniform: "u", from: "previous" }], output: { target: "output" } },
    ]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/cannot read from the same buffer/);
  });

  it("throws on duplicate pass names", () => {
    const effect = makeEffect([
      { name: "dup", fragment: "", inputs: [], output: { target: "buf" } },
      { name: "dup", fragment: "", inputs: [{ uniform: "u", from: "buf" }], output: { target: "output" } },
    ]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/duplicate pass name/);
  });

  it("throws when a reused buffer name has inconsistent size/format across passes", () => {
    const effect = makeEffect([
      { name: "a", fragment: "", inputs: [], output: { target: "scratch", scale: 0.5 } },
      { name: "b", fragment: "", inputs: [{ uniform: "u", from: "a" }], output: { target: "scratch", scale: 1 } },
      { name: "c", fragment: "", inputs: [{ uniform: "u", from: "previous" }], output: { target: "output" } },
    ]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/different size\/format/);
  });

  it("throws when a pass tries to write to the reserved 'source' buffer", () => {
    const effect = makeEffect([{ name: "bad", fragment: "", inputs: [], output: { target: "source" } }]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/reserved buffer "source"/);
  });

  it("throws on an effect with zero passes", () => {
    const effect = makeEffect([]);
    expect(() => planPasses(effect, {}, 128)).toThrow(/no passes/);
  });

  it("throws on invalid canvasSize", () => {
    const effect = makeEffect([{ name: "only", fragment: "", inputs: [], output: { target: "output" } }]);
    expect(() => planPasses(effect, {}, 0)).toThrow();
    expect(() => planPasses(effect, {}, -10)).toThrow();
  });
});
