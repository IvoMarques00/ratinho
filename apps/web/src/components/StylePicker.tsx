import type { CursorSize, StyleName } from "ani-core";
import { listEffects } from "render-core";
import type { AnimationMode } from "../lib/animationMode";
import type { SourceState } from "../lib/source";
import { ShaderParamControls } from "./ShaderParamControls";
import { Slider } from "./Slider";

interface StylePickerProps {
  source: SourceState;
  mode: AnimationMode;
  onModeChange: (mode: AnimationMode) => void;
  frameCount: number;
  onFrameCountChange: (n: number) => void;
  fps: number;
  onFpsChange: (n: number) => void;
  sizes: CursorSize[];
  onSizesChange: (sizes: CursorSize[]) => void;
}

const ALL_SIZES: CursorSize[] = [32, 48, 64];
const CLASSIC_STYLES: { value: StyleName; label: string }[] = [
  { value: "none", label: "None (static)" },
  { value: "pulse", label: "Pulse / breathe" },
  { value: "wiggle", label: "Wiggle / shake" },
  { value: "bounce", label: "Bounce" },
  { value: "rotate", label: "Rotate" },
];

const SHADER_EFFECTS = listEffects().filter((e) => e.id !== "passthrough");

function modeToSelectValue(mode: AnimationMode): string {
  return mode.engine === "classic" ? `classic:${mode.style}` : `shader:${mode.effectId}`;
}

export function StylePicker(props: StylePickerProps) {
  const { source, mode, onModeChange, frameCount, onFrameCountChange, fps, onFpsChange, sizes, onSizesChange } = props;

  function handleSelectChange(raw: string) {
    const [engine, id] = raw.split(":");
    if (engine === "classic") {
      onModeChange({ engine: "classic", style: id as StyleName, params: {} });
    } else {
      onModeChange({ engine: "shader", effectId: id!, params: {} });
    }
  }

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
            <p className="text-sm font-medium text-neutral-200">Animation</p>
            <select
              value={modeToSelectValue(mode)}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
            >
              <optgroup label="Classic (CPU · instant)">
                {CLASSIC_STYLES.map((s) => (
                  <option key={s.value} value={`classic:${s.value}`}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Shader (GPU · richer, ~1s)">
                {SHADER_EFFECTS.map((e) => (
                  <option key={e.id} value={`shader:${e.id}`}>
                    {e.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {mode.engine === "classic" && mode.style !== "none" && (
            <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
              <Slider label="Frames" value={frameCount} min={2} max={30} step={1} onChange={onFrameCountChange} />
              <Slider label="FPS" value={fps} min={2} max={30} step={1} onChange={onFpsChange} />
              <Slider
                label="Amplitude"
                value={mode.params.amplitude ?? 0.1}
                min={0.02}
                max={0.5}
                step={0.01}
                onChange={(v) => onModeChange({ ...mode, params: { ...mode.params, amplitude: v } })}
              />
              {(mode.style === "wiggle" || mode.style === "bounce") && (
                <Slider
                  label="Cycles"
                  value={mode.params.cycles ?? (mode.style === "bounce" ? 1 : 2)}
                  min={1}
                  max={6}
                  step={1}
                  onChange={(v) => onModeChange({ ...mode, params: { ...mode.params, cycles: v } })}
                />
              )}
              {(mode.style === "wiggle" || mode.style === "rotate") && (
                <Slider
                  label="Max angle (°)"
                  value={mode.params.maxAngleDeg ?? (mode.style === "rotate" ? 25 : 8)}
                  min={2}
                  max={90}
                  step={1}
                  onChange={(v) => onModeChange({ ...mode, params: { ...mode.params, maxAngleDeg: v } })}
                />
              )}
              {mode.style === "rotate" && (
                <label className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Mode</span>
                  <select
                    value={mode.params.rotateMode ?? "spin"}
                    onChange={(e) => onModeChange({ ...mode, params: { ...mode.params, rotateMode: e.target.value as "spin" | "rock" } })}
                    className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-200"
                  >
                    <option value="spin">Spin (full 360°)</option>
                    <option value="rock">Rock (back and forth)</option>
                  </select>
                </label>
              )}
            </div>
          )}

          {mode.engine === "shader" &&
            (() => {
              const effect = SHADER_EFFECTS.find((e) => e.id === mode.effectId);
              if (!effect) return null;
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                    <Slider label="Frames" value={frameCount} min={2} max={30} step={1} onChange={onFrameCountChange} />
                    <Slider label="FPS" value={fps} min={2} max={30} step={1} onChange={onFpsChange} />
                  </div>
                  <ShaderParamControls
                    schema={effect.schema}
                    params={mode.params}
                    onParamsChange={(params) => onModeChange({ ...mode, params })}
                  />
                </div>
              );
            })()}
        </>
      )}
    </div>
  );
}
