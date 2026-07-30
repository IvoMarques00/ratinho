// Public, environment-agnostic API. Deliberately excludes decode/browser.ts
// and decode/node.ts (import those directly via their own subpaths:
// "ani-core/decode/browser" or "ani-core/decode/node") so bundlers never
// pull the Node-only PNG/JPEG decoders into a browser bundle.

export * from "./types.js";
export * from "./convert.js";
export * from "./encode/ani.js";
export * from "./encode/ico.js";
export * from "./gif/extract.js";
export * from "./resize/resample.js";
export * from "./synth/index.js";
export { detectImageFormat } from "./decode/detect.js";
export type { ImageFormat } from "./decode/detect.js";
