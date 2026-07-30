import { resizeRGBA } from "ani-core";
import type { CursorSize, Hotspot, RGBAImage } from "ani-core";
import { useEffect, useMemo, useRef } from "react";
import { drawCheckerboard } from "../lib/canvas";

interface HotspotPickerProps {
  frame: RGBAImage | null;
  baseSize: CursorSize;
  hotspot: Hotspot;
  onChange: (hotspot: Hotspot) => void;
}

const DISPLAY_SCALE = 8;

export function HotspotPicker({ frame, baseSize, hotspot, onChange }: HotspotPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resized = useMemo(() => (frame ? resizeRGBA(frame, baseSize, baseSize) : null), [frame, baseSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !resized) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = baseSize;
    canvas.height = baseSize;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, baseSize, baseSize);

    drawCheckerboard(ctx, baseSize);

    const imageData = new ImageData(resized.data, baseSize, baseSize);
    ctx.putImageData(imageData, 0, 0);

    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hotspot.x + 0.5, 0);
    ctx.lineTo(hotspot.x + 0.5, baseSize);
    ctx.moveTo(0, hotspot.y + 0.5);
    ctx.lineTo(baseSize, hotspot.y + 0.5);
    ctx.stroke();
  }, [resized, baseSize, hotspot]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-200">Hotspot</p>
      <p className="text-xs text-neutral-500">Click the click-point for this cursor (defaults to center).</p>
      <canvas
        ref={canvasRef}
        style={{
          width: baseSize * DISPLAY_SCALE,
          height: baseSize * DISPLAY_SCALE,
          imageRendering: "pixelated",
          cursor: "crosshair",
        }}
        className="rounded border border-neutral-700"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.min(baseSize - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * baseSize)));
          const y = Math.min(baseSize - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * baseSize)));
          onChange({ x, y });
        }}
      />
      <p className="text-xs text-neutral-500">
        {hotspot.x}, {hotspot.y} (of {baseSize}×{baseSize}px)
      </p>
    </div>
  );
}
