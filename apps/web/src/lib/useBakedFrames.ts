import type { CursorSize, Frame } from "ani-core";
import { useEffect, useRef, useState } from "react";
import { bakeCursorFrames } from "render-core/gl";
import type { AnimationMode } from "./animationMode";
import { deriveFrames } from "./deriveFrames";
import { getSharedCanvas } from "./renderer";
import type { SourceState } from "./source";

export interface BakedFramesResult {
  frames: Frame[] | null;
  status: "idle" | "baking" | "ready" | "error";
  error: string | null;
}

const IDLE: BakedFramesResult = { frames: null, status: "idle", error: null };

// A shader bake is real GPU work (0.1-1s) that must not block the UI
// thread while the user is still dragging a slider — debounce settle
// before baking, and drop the result if a newer request has since
// superseded it.
const SHADER_BAKE_DEBOUNCE_MS = 150;

export function useBakedFrames(
  source: SourceState,
  mode: AnimationMode,
  frameCount: number,
  fps: number,
  baseSize: CursorSize,
): BakedFramesResult {
  const [result, setResult] = useState<BakedFramesResult>(IDLE);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (source.kind === "none") {
      setResult(IDLE);
      return;
    }

    if (mode.engine === "classic") {
      requestIdRef.current++;
      try {
        const frames = deriveFrames(source, { style: mode.style, frameCount, fps, params: mode.params });
        setResult({ frames, status: "ready", error: null });
      } catch (err) {
        setResult({ frames: null, status: "error", error: err instanceof Error ? err.message : "Failed to render." });
      }
      return;
    }

    // Shader engine.
    if (source.kind === "gif") {
      requestIdRef.current++;
      setResult({
        frames: null,
        status: "error",
        error: "Shader effects don't yet support GIF input — switch to a Classic style, or upload a static image.",
      });
      return;
    }

    const requestId = ++requestIdRef.current;
    setResult((prev) => ({ ...prev, status: "baking" }));

    const timeoutId = window.setTimeout(() => {
      try {
        const canvas = getSharedCanvas();
        const frames = bakeCursorFrames(canvas, {
          effectId: mode.effectId,
          sourceImage: source.image,
          size: baseSize,
          frameCount,
          fps,
          params: mode.params,
        });
        if (requestIdRef.current === requestId) {
          setResult({ frames, status: "ready", error: null });
        }
      } catch (err) {
        if (requestIdRef.current === requestId) {
          setResult({ frames: null, status: "error", error: err instanceof Error ? err.message : "Shader render failed." });
        }
      }
    }, SHADER_BAKE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [source, mode.engine, mode.engine === "shader" ? mode.effectId : mode.style, JSON.stringify(mode.params), frameCount, fps, baseSize]);

  return result;
}
