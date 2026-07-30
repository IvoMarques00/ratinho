import type { CursorSize, StyleName, StyleParams } from "ani-core";
import type { SourceState } from "../lib/source";

interface StylePickerProps {
  source: SourceState;
  style: StyleName;
  onStyleChange: (style: StyleName) => void;
  frameCount: number;
  onFrameCountChange: (n: number) => void;
  fps: number;
  onFpsChange: (n: number) => void;
  params: StyleParams;
  onParamsChange: (params: StyleParams) => void;
  sizes: CursorSize[];
  onSizesChange: (sizes: CursorSize[]) => void;
}

const ALL_SIZES: CursorSize[] = [32, 48, 64];
const STYLES: { value: StyleName; label: string }[] = [
  { value: "none", label: "None (static)" },
  { value: "pulse", label: "Pulse / breathe" },
  { value: "wiggle", label: "Wiggle / shake" },
  { value: "bounce", label: "Bounce" },
  { value: "rotate", label: "Rotate" },
];

function Slider(props: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-neutral-400">
      <span className="flex justify-between">
        <span>{props.label}</span>
        <span className="text-neutral-300">{props.value}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="accent-sky-500"
      />
    </label>
  );
}

export function StylePicker(props: StylePickerProps) {
  const {
    source,
    style,
    onStyleChange,
    frameCount,
    onFrameCountChange,
    fps,
    onFpsChange,
    params,
    onParamsChange,
    sizes,
    onSizesChange,
  } = props;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-neutral-200">Cursor size(s)</p>
        <div className="mt-2 flex gap-3">
          {ALL_SIZES.map((size) => (
            <label key={size} className="flex items-center gap-1.5 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={sizes.includes(size)}
                onChange={(e) => {
                  const next = e.target.checked ? [...sizes, size] : sizes.filter((s) => s !== size);
                  onSizesChange(next.length > 0 ? next.sort((a, b) => a - b) : sizes);
                }}
                className="accent-sky-500"
              />
              {size}px
            </label>
          ))}
        </div>
      </div>

      {source.kind === "gif" ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-400">
          Using this GIF's own {source.frames.length} frame{source.frames.length === 1 ? "" : "s"} and timing —
          animation style options don't apply to GIF input.
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium text-neutral-200">Animation style</p>
            <select
              value={style}
              onChange={(e) => onStyleChange(e.target.value as StyleName)}
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {style !== "none" && (
            <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <Slider label="Frames" value={frameCount} min={2} max={30} step={1} onChange={onFrameCountChange} />
              <Slider label="FPS" value={fps} min={2} max={30} step={1} onChange={onFpsChange} />
              <Slider
                label="Amplitude"
                value={params.amplitude ?? 0.1}
                min={0.02}
                max={0.5}
                step={0.01}
                onChange={(v) => onParamsChange({ ...params, amplitude: v })}
              />
              {(style === "wiggle" || style === "bounce") && (
                <Slider
                  label="Cycles"
                  value={params.cycles ?? (style === "bounce" ? 1 : 2)}
                  min={1}
                  max={6}
                  step={1}
                  onChange={(v) => onParamsChange({ ...params, cycles: v })}
                />
              )}
              {(style === "wiggle" || style === "rotate") && (
                <Slider
                  label="Max angle (°)"
                  value={params.maxAngleDeg ?? (style === "rotate" ? 25 : 8)}
                  min={2}
                  max={90}
                  step={1}
                  onChange={(v) => onParamsChange({ ...params, maxAngleDeg: v })}
                />
              )}
              {style === "rotate" && (
                <label className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Mode</span>
                  <select
                    value={params.rotateMode ?? "spin"}
                    onChange={(e) => onParamsChange({ ...params, rotateMode: e.target.value as "spin" | "rock" })}
                    className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-200"
                  >
                    <option value="spin">Spin (full 360°)</option>
                    <option value="rock">Rock (back and forth)</option>
                  </select>
                </label>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
