import { resizeRGBA } from "ani-core";
import type { CursorSize, Frame } from "ani-core";
import { useEffect, useMemo, useRef } from "react";
import { drawCheckerboard } from "../lib/canvas";

interface LivePreviewProps {
  frames: Frame[] | null;
  baseSize: CursorSize;
}

const DISPLAY_SCALE = 8;

export function LivePreview({ frames, baseSize }: LivePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resizedFrames = useMemo(
    () => (frames ? frames.map((f) => ({ ...resizeRGBA(f, baseSize, baseSize), delayMs: f.delayMs })) : null),
    [frames, baseSize],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !resizedFrames || resizedFrames.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = baseSize;
    canvas.height = baseSize;
    ctx.imageSmoothingEnabled = false;

    let index = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function draw() {
      if (!ctx || !resizedFrames) return;
      const frame = resizedFrames[index]!;
      ctx.clearRect(0, 0, baseSize, baseSize);
      drawCheckerboard(ctx, baseSize);
      ctx.putImageData(new ImageData(frame.data, baseSize, baseSize), 0, 0);
    }

    function tick() {
      if (cancelled || !resizedFrames) return;
      draw();
      const delay = Math.max(16, resizedFrames[index]!.delayMs);
      timeoutId = setTimeout(() => {
        index = (index + 1) % resizedFrames.length;
        tick();
      }, delay);
    }

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [resizedFrames, baseSize]);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-medium text-neutral-200">Live preview</p>
      {resizedFrames ? (
        <canvas
          ref={canvasRef}
          style={{ width: baseSize * DISPLAY_SCALE, height: baseSize * DISPLAY_SCALE, imageRendering: "pixelated" }}
          className="rounded border border-neutral-700"
        />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center rounded border border-dashed border-neutral-700 text-xs text-neutral-600">
          Upload an image to preview
        </div>
      )}
      {resizedFrames && (
        <p className="text-xs text-neutral-500">
          {resizedFrames.length} frame{resizedFrames.length === 1 ? "" : "s"} at {baseSize}×{baseSize}px
        </p>
      )}
    </div>
  );
}
