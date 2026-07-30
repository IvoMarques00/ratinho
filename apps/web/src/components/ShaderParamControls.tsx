import type { UniformSchema } from "render-core";
import { Slider } from "./Slider";

interface ShaderParamControlsProps {
  schema: UniformSchema;
  params: Record<string, unknown>;
  onParamsChange: (params: Record<string, unknown>) => void;
}

function colorToHex(v: [number, number, number, number]): string {
  const toByte = (c: number) =>
    Math.round(Math.min(1, Math.max(0, c)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toByte(v[0])}${toByte(v[1])}${toByte(v[2])}`;
}

function hexToColor(hex: string, alpha: number): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b, alpha];
}

/** Renders form controls generated directly from an effect's UniformSchema — register an effect, get its UI for free. */
export function ShaderParamControls({ schema, params, onParamsChange }: ShaderParamControlsProps) {
  const entries = Object.entries(schema);
  if (entries.length === 0) {
    return <p className="text-xs text-neutral-500">This effect has no adjustable params.</p>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
      {entries.map(([key, spec]) => {
        const raw = params[key];

        if (spec.type === "float" || spec.type === "int") {
          const value = typeof raw === "number" ? raw : spec.default;
          return (
            <Slider
              key={key}
              label={spec.label}
              value={value}
              min={spec.min}
              max={spec.max}
              step={spec.type === "int" ? 1 : (spec.step ?? (spec.max - spec.min) / 100)}
              onChange={(v) => onParamsChange({ ...params, [key]: v })}
            />
          );
        }

        if (spec.type === "bool") {
          const value = typeof raw === "boolean" ? raw : spec.default;
          return (
            <label key={key} className="flex items-center justify-between text-xs text-neutral-400">
              <span>{spec.label}</span>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onParamsChange({ ...params, [key]: e.target.checked })}
                className="accent-sky-500"
              />
            </label>
          );
        }

        if (spec.type === "enum") {
          const value = typeof raw === "string" ? raw : spec.default;
          return (
            <label key={key} className="flex items-center justify-between gap-2 text-xs text-neutral-400">
              <span>{spec.label}</span>
              <select
                value={value}
                onChange={(e) => onParamsChange({ ...params, [key]: e.target.value })}
                className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-200"
              >
                {spec.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (spec.type === "color") {
          const value = Array.isArray(raw) && raw.length === 4 ? (raw as [number, number, number, number]) : spec.default;
          return (
            <div key={key} className="flex flex-col gap-1 text-xs text-neutral-400">
              <span className="flex items-center justify-between">
                <span>{spec.label}</span>
                <input
                  type="color"
                  value={colorToHex(value)}
                  onChange={(e) => onParamsChange({ ...params, [key]: hexToColor(e.target.value, value[3]) })}
                  className="h-6 w-10 cursor-pointer rounded border border-neutral-700 bg-transparent"
                />
              </span>
              <Slider
                label="Alpha"
                value={value[3]}
                min={0}
                max={1}
                step={0.01}
                onChange={(a) => onParamsChange({ ...params, [key]: [value[0], value[1], value[2], a] })}
              />
            </div>
          );
        }

        if (spec.type === "vec2") {
          const value = Array.isArray(raw) && raw.length === 2 ? (raw as [number, number]) : spec.default;
          return (
            <div key={key} className="flex flex-col gap-2">
              <Slider label={`${spec.label} X`} value={value[0]} min={spec.min[0]} max={spec.max[0]} step={0.01} onChange={(x) => onParamsChange({ ...params, [key]: [x, value[1]] })} />
              <Slider label={`${spec.label} Y`} value={value[1]} min={spec.min[1]} max={spec.max[1]} step={0.01} onChange={(y) => onParamsChange({ ...params, [key]: [value[0], y] })} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
