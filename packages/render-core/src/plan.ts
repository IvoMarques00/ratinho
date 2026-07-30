import type { EffectDefinition, PassFormat, PassSpec, ResolvedParams } from "./types.js";

export interface BufferSlot {
  name: string;
  width: number;
  height: number;
  format: PassFormat;
}

export interface PlannedPassInput {
  uniform: string;
  bufferName: string;
}

export interface PlannedPass {
  name: string;
  fragment: string;
  inputs: PlannedPassInput[];
  outputBuffer: string;
  format: PassFormat;
  blend: NonNullable<PassSpec["blend"]>;
  passIndex: number;
  uniformsFn?: PassSpec["uniforms"];
  declarations?: string;
}

export interface RenderPlan {
  /** Render resolution in pixels (square) for every buffer at scale=1, including "source". */
  canvasSize: number;
  buffers: BufferSlot[];
  passes: PlannedPass[];
}

/**
 * Turns an effect's passes() into a fully-validated, GL-free execution
 * plan: resolves buffer sizes/formats, resolves "source"/"previous"
 * references to concrete buffer names, and enforces the pipeline's
 * invariants (last pass writes rgba8 to "output", no pass reads the
 * buffer it writes, every input resolves to an already-produced buffer —
 * which structurally rules out cycles since a buffer only exists in the
 * map once an earlier pass has produced it).
 */
export function planPasses(effect: EffectDefinition, params: ResolvedParams, canvasSize: number): RenderPlan {
  if (canvasSize <= 0) throw new Error(`canvasSize must be > 0, got ${canvasSize}`);

  const passSpecs = effect.passes(params);
  if (passSpecs.length === 0) {
    throw new Error(`Effect "${effect.id}" has no passes`);
  }

  const buffers = new Map<string, BufferSlot>();
  buffers.set("source", { name: "source", width: canvasSize, height: canvasSize, format: "rgba16f" });

  const plannedPasses: PlannedPass[] = [];
  const seenNames = new Set<string>();
  let previousOutputName: string | null = null;

  passSpecs.forEach((spec, index) => {
    if (seenNames.has(spec.name)) {
      throw new Error(`Effect "${effect.id}": duplicate pass name "${spec.name}"`);
    }
    seenNames.add(spec.name);

    const isLast = index === passSpecs.length - 1;
    const outputName = spec.output.target;

    if (outputName === "source") {
      throw new Error(`Effect "${effect.id}": pass "${spec.name}" cannot write to reserved buffer "source"`);
    }
    if (isLast && outputName !== "output") {
      throw new Error(`Effect "${effect.id}": last pass "${spec.name}" must write to output.target "output", got "${outputName}"`);
    }
    if (!isLast && outputName === "output") {
      throw new Error(`Effect "${effect.id}": only the last pass may write to "output" (pass "${spec.name}" is not last)`);
    }

    const format: PassFormat = spec.format ?? (isLast ? "rgba8" : "rgba16f");
    if (isLast && format !== "rgba8") {
      throw new Error(`Effect "${effect.id}": final pass "${spec.name}" must use format "rgba8", got "${format}"`);
    }

    const scale = spec.output.scale ?? 1;
    if (scale <= 0) {
      throw new Error(`Effect "${effect.id}": pass "${spec.name}" has invalid output.scale ${scale}`);
    }
    const width = Math.max(1, Math.round(canvasSize * scale));
    const height = width;

    const existing = buffers.get(outputName);
    if (existing) {
      if (existing.width !== width || existing.height !== height || existing.format !== format) {
        throw new Error(
          `Effect "${effect.id}": pass "${spec.name}" redeclares buffer "${outputName}" with a different size/format than an earlier pass`,
        );
      }
    } else {
      buffers.set(outputName, { name: outputName, width, height, format });
    }

    const resolvedInputs: PlannedPassInput[] = spec.inputs.map((input) => {
      let bufferName: string;
      if (input.from === "source") {
        bufferName = "source";
      } else if (input.from === "previous") {
        if (previousOutputName === null) {
          throw new Error(`Effect "${effect.id}": pass "${spec.name}" uses from:"previous" but is the first pass`);
        }
        bufferName = previousOutputName;
      } else {
        bufferName = input.from;
      }

      if (!buffers.has(bufferName)) {
        throw new Error(
          `Effect "${effect.id}": pass "${spec.name}" input "${input.uniform}" references buffer "${bufferName}", which has not been produced by an earlier pass`,
        );
      }
      if (bufferName === outputName) {
        throw new Error(`Effect "${effect.id}": pass "${spec.name}" cannot read from the same buffer it writes to ("${outputName}")`);
      }
      return { uniform: input.uniform, bufferName };
    });

    plannedPasses.push({
      name: spec.name,
      fragment: spec.fragment,
      inputs: resolvedInputs,
      outputBuffer: outputName,
      format,
      blend: spec.blend ?? "none",
      passIndex: index,
      uniformsFn: spec.uniforms,
      declarations: spec.declarations,
    });

    previousOutputName = outputName;
  });

  return { canvasSize, buffers: Array.from(buffers.values()), passes: plannedPasses };
}
