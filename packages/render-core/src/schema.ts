import type { EnumUniformSpec, ResolvedParams, ResolvedValue, UniformSchema, UniformSpec } from "./types.js";

export function defaultGlslName(key: string): string {
  return "u" + key.charAt(0).toUpperCase() + key.slice(1);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveOne(key: string, spec: UniformSpec, raw: unknown): ResolvedValue {
  switch (spec.type) {
    case "float": {
      const n = raw === undefined ? spec.default : Number(raw);
      if (Number.isNaN(n)) throw new Error(`Param "${key}" must be a number, got ${JSON.stringify(raw)}`);
      return clampNumber(n, spec.min, spec.max);
    }
    case "int": {
      const n = raw === undefined ? spec.default : Math.round(Number(raw));
      if (Number.isNaN(n)) throw new Error(`Param "${key}" must be an integer, got ${JSON.stringify(raw)}`);
      return clampNumber(n, spec.min, spec.max);
    }
    case "bool": {
      if (raw === undefined) return spec.default;
      if (typeof raw === "boolean") return raw;
      if (raw === "true") return true;
      if (raw === "false") return false;
      throw new Error(`Param "${key}" must be a boolean, got ${JSON.stringify(raw)}`);
    }
    case "color": {
      const v = (raw === undefined ? spec.default : raw) as unknown;
      if (!Array.isArray(v) || v.length !== 4 || v.some((c) => typeof c !== "number")) {
        throw new Error(`Param "${key}" must be a [r,g,b,a] array of 4 numbers, got ${JSON.stringify(raw)}`);
      }
      return v.map((c) => clampNumber(c, 0, 1)) as [number, number, number, number];
    }
    case "vec2": {
      const v = (raw === undefined ? spec.default : raw) as unknown;
      if (!Array.isArray(v) || v.length !== 2 || v.some((c) => typeof c !== "number")) {
        throw new Error(`Param "${key}" must be a [x,y] array of 2 numbers, got ${JSON.stringify(raw)}`);
      }
      return [clampNumber(v[0], spec.min[0], spec.max[0]), clampNumber(v[1], spec.min[1], spec.max[1])];
    }
    case "enum": {
      const value = raw === undefined ? spec.default : String(raw);
      const enumSpec = spec as EnumUniformSpec;
      if (!enumSpec.options.some((o) => o.value === value)) {
        const valid = enumSpec.options.map((o) => o.value).join(", ");
        throw new Error(`Param "${key}" must be one of [${valid}], got ${JSON.stringify(raw)}`);
      }
      return value;
    }
  }
}

/**
 * Fills defaults, clamps numeric params to their declared range, validates
 * enum membership, and rejects unknown keys — a typo'd param is a hard
 * error, never a silent no-op.
 */
export function resolveParams(schema: UniformSchema, raw: Record<string, unknown> = {}): ResolvedParams {
  const unknown = Object.keys(raw).filter((k) => !(k in schema));
  if (unknown.length > 0) {
    const valid = Object.keys(schema).join(", ");
    throw new Error(`Unknown param(s): ${unknown.join(", ")}. Valid params: ${valid}`);
  }

  const resolved: ResolvedParams = {};
  for (const [key, spec] of Object.entries(schema)) {
    resolved[key] = resolveOne(key, spec, raw[key]);
  }
  return resolved;
}

function parseColorString(s: string): [number, number, number, number] {
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length !== 6 && hex.length !== 8) {
      throw new Error(`Invalid hex color "${s}", expected #rrggbb or #rrggbbaa`);
    }
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  }
  const parts = s.split(",").map((p) => Number.parseFloat(p.trim()));
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid color "${s}", expected "r,g,b,a" (0..1) or "#rrggbb[aa]"`);
  }
  return parts as [number, number, number, number];
}

/** Coerces CLI-style "key=value" string params into the JS shapes resolveParams() expects. */
export function coerceFromCliStrings(schema: UniformSchema, raw: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, strValue] of Object.entries(raw)) {
    const spec = schema[key];
    if (!spec) {
      out[key] = strValue; // let resolveParams() report the unknown-key error uniformly
      continue;
    }
    if (spec.type === "color") {
      out[key] = parseColorString(strValue);
    } else if (spec.type === "vec2") {
      const parts = strValue.split(",").map((p) => Number.parseFloat(p.trim()));
      if (parts.length !== 2 || parts.some(Number.isNaN)) {
        throw new Error(`Invalid vec2 "${strValue}" for param "${key}", expected "x,y"`);
      }
      out[key] = parts;
    } else {
      out[key] = strValue;
    }
  }
  return out;
}

export interface SchemaFieldDescription {
  key: string;
  type: string;
  label: string;
  default: unknown;
  range?: string;
  options?: string[];
}

export function describeSchema(schema: UniformSchema): SchemaFieldDescription[] {
  return Object.entries(schema).map(([key, spec]) => {
    const base: SchemaFieldDescription = { key, type: spec.type, label: spec.label, default: spec.default };
    if (spec.type === "float" || spec.type === "int") {
      base.range = `${spec.min}..${spec.max}`;
    } else if (spec.type === "vec2") {
      base.range = `[${spec.min[0]},${spec.min[1]}]..[${spec.max[0]},${spec.max[1]}]`;
    } else if (spec.type === "enum") {
      base.options = spec.options.map((o) => o.value);
    }
    return base;
  });
}
