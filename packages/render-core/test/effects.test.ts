import { describe, expect, it } from "vitest";
import { buildFragmentSource } from "../src/glsl/assemble.js";
import { findDuplicateUniformDeclarations, findPossiblyUndeclaredUniforms, lintPhaseUsage } from "../src/glsl/lint.js";
import { listEffects } from "../src/effects/index.js";
import { planPasses } from "../src/plan.js";
import { resolveParams } from "../src/schema.js";

describe("registered effects — GPU-free static checks", () => {
  const effects = listEffects();

  it("the registry is non-empty", () => {
    expect(effects.length).toBeGreaterThan(0);
  });

  for (const effect of effects) {
    describe(effect.id, () => {
      it("every schema default lies within its own declared range", () => {
        for (const [key, spec] of Object.entries(effect.schema)) {
          if (spec.type === "float" || spec.type === "int") {
            expect(spec.default, `${effect.id}.${key} default`).toBeGreaterThanOrEqual(spec.min);
            expect(spec.default, `${effect.id}.${key} default`).toBeLessThanOrEqual(spec.max);
          } else if (spec.type === "enum") {
            expect(spec.options.map((o) => o.value), `${effect.id}.${key} default`).toContain(spec.default);
          }
        }
      });

      it("plans successfully at min/default/max params without touching a GL context", () => {
        const defaultParams = resolveParams(effect.schema);
        const plan = planPasses(effect, defaultParams, 256);
        expect(plan.passes.length).toBeGreaterThan(0);
        const finalPass = plan.passes[plan.passes.length - 1]!;
        expect(finalPass.outputBuffer).toBe("output");
        expect(finalPass.format).toBe("rgba8");

        const minParams = resolveParams(
          effect.schema,
          Object.fromEntries(
            Object.entries(effect.schema)
              .filter(([, spec]) => spec.type === "float" || spec.type === "int")
              .map(([key, spec]) => [key, (spec as { min: number }).min]),
          ),
        );
        expect(() => planPasses(effect, minParams, 256)).not.toThrow();

        const maxParams = resolveParams(
          effect.schema,
          Object.fromEntries(
            Object.entries(effect.schema)
              .filter(([, spec]) => spec.type === "float" || spec.type === "int")
              .map(([key, spec]) => [key, (spec as { max: number }).max]),
          ),
        );
        expect(() => planPasses(effect, maxParams, 256)).not.toThrow();
      });

      it("no assembled pass declares the same uniform name twice", () => {
        const params = resolveParams(effect.schema);
        const plan = planPasses(effect, params, 256);
        for (const pass of plan.passes) {
          const source = buildFragmentSource(effect, pass);
          const duplicates = findDuplicateUniformDeclarations(source);
          expect(duplicates, `${effect.id}/${pass.name}`).toEqual([]);
        }
      });

      it("every assembled pass has no undeclared u-prefixed identifiers", () => {
        const params = resolveParams(effect.schema);
        const plan = planPasses(effect, params, 256);
        for (const pass of plan.passes) {
          const source = buildFragmentSource(effect, pass);
          const undeclared = findPossiblyUndeclaredUniforms(source);
          expect(undeclared, `${effect.id}/${pass.name}`).toEqual([]);
        }
      });

      it("uPhase usage in every pass follows an allowed periodic pattern", () => {
        const params = resolveParams(effect.schema);
        const plan = planPasses(effect, params, 256);
        for (const pass of plan.passes) {
          const issues = lintPhaseUsage(pass.fragment);
          expect(issues, `${effect.id}/${pass.name}`).toEqual([]);
        }
      });
    });
  }
});
