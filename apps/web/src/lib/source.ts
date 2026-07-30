import type { Frame, RGBAImage } from "ani-core";

export type SourceState =
  | { kind: "none" }
  | { kind: "static"; image: RGBAImage; fileName: string }
  | { kind: "gif"; frames: Frame[]; fileName: string };
