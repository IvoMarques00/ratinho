import { describe, expect, it } from "vitest";
import { delayMsForFps, framePhases, phaseForFrame, TAU } from "../src/timing.js";

describe("timing", () => {
  it("TAU is 2*PI", () => {
    expect(TAU).toBeCloseTo(Math.PI * 2);
  });

  it("phaseForFrame sweeps [0,1) and never reaches 1", () => {
    expect(phaseForFrame(0, 8)).toBe(0);
    expect(phaseForFrame(4, 8)).toBe(0.5);
    expect(phaseForFrame(7, 8)).toBeCloseTo(0.875);
  });

  it("phaseForFrame rejects frameCount <= 0", () => {
    expect(() => phaseForFrame(0, 0)).toThrow();
    expect(() => phaseForFrame(0, -1)).toThrow();
  });

  it("framePhases produces exactly frameCount evenly-spaced values starting at 0", () => {
    const phases = framePhases(4);
    expect(phases).toEqual([0, 0.25, 0.5, 0.75]);
  });

  it("delayMsForFps is the millisecond period", () => {
    expect(delayMsForFps(12)).toBeCloseTo(1000 / 12);
    expect(delayMsForFps(1)).toBe(1000);
  });

  it("delayMsForFps rejects fps <= 0", () => {
    expect(() => delayMsForFps(0)).toThrow();
  });
});
