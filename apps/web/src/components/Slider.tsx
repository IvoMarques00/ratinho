export function Slider(props: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
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
