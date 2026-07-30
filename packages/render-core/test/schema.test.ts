import { describe, expect, it } from "vitest";
import { coerceFromCliStrings, defaultGlslName, describeSchema, resolveParams } from "../src/schema.js";
import type { UniformSchema } from "../src/types.js";

const SCHEMA: UniformSchema = {
  intensity: { type: "float", label: "Intensity", default: 1.2, min: 0, max: 3, step: 0.1 },
  iterations: { type: "int", label: "Iterations", default: 2, min: 1, max: 4 },
  tonemap: { type: "bool", label: "Tonemap", default: true },
  tint: { type: "color", label: "Tint", default: [1, 0.85, 0.6, 1] },
  offset: { type: "vec2", label: "Offset", default: [0, 0], min: [-1, -1], max: [1, 1] },
  mode: {
    type: "enum",
    label: "Mode",
    default: "spin",
    options: [
      { value: "spin", label: "Spin" },
      { value: "rock", label: "Rock" },
    ],
  },
};

describe("defaultGlslName", () => {
  it("PascalCases and prefixes with u", () => {
    expect(defaultGlslName("pulseDepth")).toBe("uPulseDepth");
    expect(defaultGlslName("intensity")).toBe("uIntensity");
  });
});

describe("resolveParams", () => {
  it("fills defaults when no raw params given", () => {
    const resolved = resolveParams(SCHEMA, {});
    expect(resolved).toEqual({
      intensity: 1.2,
      iterations: 2,
      tonemap: true,
      tint: [1, 0.85, 0.6, 1],
      offset: [0, 0],
      mode: "spin",
    });
  });

  it("clamps float/int to their declared range", () => {
    const resolved = resolveParams(SCHEMA, { intensity: 999, iterations: -5 });
    expect(resolved.intensity).toBe(3);
    expect(resolved.iterations).toBe(1);
  });

  it("rounds int values", () => {
    const resolved = resolveParams(SCHEMA, { iterations: 2.6 });
    expect(resolved.iterations).toBe(3);
  });

  it("clamps vec2 per-component", () => {
    const resolved = resolveParams(SCHEMA, { offset: [5, -5] });
    expect(resolved.offset).toEqual([1, -1]);
  });

  it("clamps color channels to 0..1", () => {
    const resolved = resolveParams(SCHEMA, { tint: [2, -1, 0.5, 1.5] });
    expect(resolved.tint).toEqual([1, 0, 0.5, 1]);
  });

  it("validates enum membership", () => {
    expect(resolveParams(SCHEMA, { mode: "rock" }).mode).toBe("rock");
    expect(() => resolveParams(SCHEMA, { mode: "nonexistent" })).toThrow(/must be one of/);
  });

  it("rejects unknown keys", () => {
    expect(() => resolveParams(SCHEMA, { bogus: 1 })).toThrow(/Unknown param/);
  });

  it("throws a clear error for non-numeric float/int input", () => {
    expect(() => resolveParams(SCHEMA, { intensity: "not-a-number" })).toThrow();
  });

  it("every registered field's default lies within its own declared range", () => {
    for (const [key, spec] of Object.entries(SCHEMA)) {
      if (spec.type === "float" || spec.type === "int") {
        expect(spec.default).toBeGreaterThanOrEqual(spec.min);
        expect(spec.default).toBeLessThanOrEqual(spec.max);
      } else if (spec.type === "vec2") {
        expect(spec.default[0]).toBeGreaterThanOrEqual(spec.min[0]);
        expect(spec.default[0]).toBeLessThanOrEqual(spec.max[0]);
        expect(spec.default[1]).toBeGreaterThanOrEqual(spec.min[1]);
        expect(spec.default[1]).toBeLessThanOrEqual(spec.max[1]);
      } else if (spec.type === "enum") {
        expect(spec.options.map((o) => o.value)).toContain(spec.default);
      }
      void key;
    }
  });
});

describe("coerceFromCliStrings", () => {
  it("parses numbers/booleans as plain strings (resolveParams coerces them)", () => {
    const coerced = coerceFromCliStrings(SCHEMA, { intensity: "1.5", tonemap: "false" });
    expect(coerced).toEqual({ intensity: "1.5", tonemap: "false" });
    expect(resolveParams(SCHEMA, coerced)).toMatchObject({ intensity: 1.5, tonemap: false });
  });

  it("parses vec2 as comma-separated numbers", () => {
    const coerced = coerceFromCliStrings(SCHEMA, { offset: "0.5,-0.25" });
    expect(coerced.offset).toEqual([0.5, -0.25]);
  });

  it("parses color as r,g,b,a", () => {
    const coerced = coerceFromCliStrings(SCHEMA, { tint: "1,0.5,0,1" });
    expect(coerced.tint).toEqual([1, 0.5, 0, 1]);
  });

  it("parses color as hex, with and without alpha", () => {
    expect(coerceFromCliStrings(SCHEMA, { tint: "#ff8000" }).tint).toEqual([1, 0.5019607843137255, 0, 1]);
    const withAlpha = coerceFromCliStrings(SCHEMA, { tint: "#ff800080" }).tint as number[];
    expect(withAlpha[3]).toBeCloseTo(0.502, 2);
  });

  it("throws on malformed vec2/color strings", () => {
    expect(() => coerceFromCliStrings(SCHEMA, { offset: "not,valid" })).toThrow();
    expect(() => coerceFromCliStrings(SCHEMA, { tint: "#zz" })).toThrow();
  });
});

describe("describeSchema", () => {
  it("produces a human-readable field list for --list-effects / docs", () => {
    const described = describeSchema(SCHEMA);
    expect(described).toHaveLength(6);
    const intensity = described.find((f) => f.key === "intensity")!;
    expect(intensity.range).toBe("0..3");
    const mode = described.find((f) => f.key === "mode")!;
    expect(mode.options).toEqual(["spin", "rock"]);
  });
});
