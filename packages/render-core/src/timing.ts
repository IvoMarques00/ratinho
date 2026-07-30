export const TAU = Math.PI * 2;

/** Normalized loop position for a frame: 0 at frame 0, sweeping toward (not reaching) 1. */
export function phaseForFrame(frameIndex: number, frameCount: number): number {
  if (frameCount <= 0) throw new Error(`frameCount must be > 0, got ${frameCount}`);
  return frameIndex / frameCount;
}

export function framePhases(frameCount: number): number[] {
  return Array.from({ length: frameCount }, (_, i) => phaseForFrame(i, frameCount));
}

export function delayMsForFps(fps: number): number {
  if (fps <= 0) throw new Error(`fps must be > 0, got ${fps}`);
  return 1000 / fps;
}
