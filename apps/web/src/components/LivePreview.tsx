import { resizeRGBA } from "ani-core";
import type { CursorSize, Frame } from "ani-core";
import { useEffect, useMemo, useRef } from "react";
import { drawCheckerboard } from "../lib/canvas";

interface LivePreviewProps {
  frames: Frame[] | null;
  baseSize: CursorSize;
  status?: "idle" | "baking" | "ready" | "error";
}

const DISPLAY_SCALE = 8;

export function LivePreview({ frames, baseSize, status = "ready" }: LivePreviewProps) {
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
    let elapsedInFrame = 0;
    let lastTimestamp: number | null = null;
    let rafId: number;

    function draw() {
      if (!ctx || !resizedFrames) return;
      const frame = resizedFrames[index]!;
      ctx.clearRect(0, 0, baseSize, baseSize);
      drawCheckerboard(ctx, baseSize);
      ctx.putImageData(new ImageData(frame.data, baseSize, baseSize), 0, 0);
    }

    let stopped = false;

    function tick(timestamp: number) {
      if (!resizedFrames || stopped) return;
      try {
        if (lastTimestamp === null) {
          lastTimestamp = timestamp;
          draw();
        } else {
          const dt = timestamp - lastTimestamp;
          lastTimestamp = timestamp;
          elapsedInFrame += dt;
          const currentDelay = Math.max(16, resizedFrames[index]!.delayMs);
          if (elapsedInFrame >= currentDelay) {
            elapsedInFrame -= currentDelay;
            index = (index + 1) % resizedFrames.length;
            draw();
          }
        }
      } catch (err) {
        // Not render-phase, so an ErrorBoundary can't catch this — stop
        // the loop instead of spamming console.error every frame.
        stopped = true;
        console.error("LivePreview animation loop stopped after an error:", err);
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [resizedFrames, baseSize]);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-medium text-neutral-200">Live preview</p>
      {resizedFrames ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            style={{ width: baseSize * DISPLAY_SCALE, height: baseSize * DISPLAY_SCALE, imageRendering: "pixelated" }}
            className="rounded border border-neutral-700"
          />
          {status === "baking" && (
            <div className="absolute inset-0 flex items-center justify-center rounded bg-neutral-950/60 text-xs text-neutral-300">
              Rendering…
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-40 w-40 items-center justify-center rounded border border-dashed border-neutral-700 text-xs text-neutral-600">
          {status === "baking" ? "Rendering…" : "Upload an image to preview"}
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
