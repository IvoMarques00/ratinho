export type UniformType = "float" | "int" | "bool" | "color" | "vec2" | "enum";

interface UniformSpecBase {
  label: string;
  description?: string;
  /** GLSL uniform name. Defaults to "u" + PascalCase(key). */
  glslName?: string;
}

export interface FloatUniformSpec extends UniformSpecBase {
  type: "float";
  default: number;
  min: number;
  max: number;
  step?: number;
}

export interface IntUniformSpec extends UniformSpecBase {
  type: "int";
  default: number;
  min: number;
  max: number;
}

export interface BoolUniformSpec extends UniformSpecBase {
  type: "bool";
  default: boolean;
}

/** Linear-space RGBA, each channel 0..1. */
export interface ColorUniformSpec extends UniformSpecBase {
  type: "color";
  default: [number, number, number, number];
}

export interface Vec2UniformSpec extends UniformSpecBase {
  type: "vec2";
  default: [number, number];
  min: [number, number];
  max: [number, number];
}

export interface EnumOption {
  value: string;
  label: string;
}

export interface EnumUniformSpec extends UniformSpecBase {
  type: "enum";
  options: EnumOption[];
  default: string;
}

export type UniformSpec =
  | FloatUniformSpec
  | IntUniformSpec
  | BoolUniformSpec
  | ColorUniformSpec
  | Vec2UniformSpec
  | EnumUniformSpec;

export type UniformSchema = Record<string, UniformSpec>;

export type ResolvedValue = number | boolean | [number, number, number, number] | [number, number] | string;

/** Params after resolveParams(): defaults filled, clamped, enum mapped to its option value (still a string). */
export type ResolvedParams = Record<string, ResolvedValue>;

export interface PassContext {
  params: ResolvedParams;
  passIndex: number;
}

export type PassFormat = "rgba8" | "rgba16f";
export type PassBlend = "none" | "premultiplied-over" | "additive";

export interface PassInput {
  /** The GLSL sampler2D uniform name this input is bound to. */
  uniform: string;
  /** "source" = the ingested source texture; "previous" = the immediately preceding pass's output; otherwise a named buffer produced by an earlier pass. */
  from: "source" | "previous" | string;
}

export interface PassOutput {
  /** "output" is reserved for the final resolved frame; any other name creates/reuses a named buffer. */
  target: string;
  /** Fraction of the base render size, e.g. 0.5 = half resolution. Defaults to 1. */
  scale?: number;
}

export interface PassSpec {
  /** Must be unique within one effect's passes() output. */
  name: string;
  /** GLSL ES 3.00 fragment shader body (no #version/precision — assembled automatically). */
  fragment: string;
  inputs: PassInput[];
  output: PassOutput;
  /** Defaults to "rgba16f", except the pass writing to "output", which must be "rgba8" (or omitted). */
  format?: PassFormat;
  blend?: PassBlend;
  /** Extra per-pass uniform values computed in JS (e.g. blur direction vectors). */
  uniforms?: (ctx: PassContext) => Record<string, number | number[] | boolean>;
}

export interface EffectDefinition {
  id: string;
  label: string;
  description: string;
  /** Fraction of source size added as transparent margin on each side before any pass runs. */
  padding: number;
  schema: UniformSchema;
  passes: (params: ResolvedParams) => PassSpec[];
}

export interface BakeOptions {
  frameCount: number;
  fps: number;
  /** Target cursor pixel size (square). */
  size: number;
  /** Supersample factor for the internal render resolution. Auto-chosen if omitted. */
  supersample?: number;
  seed?: number;
  /** Raw, unresolved param overrides — coerced/validated against the effect's schema. */
  params?: Record<string, unknown>;
}
