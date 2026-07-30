import type { StyleName, StyleParams } from "ani-core";

export type AnimationMode =
  | { engine: "classic"; style: StyleName; params: StyleParams }
  | { engine: "shader"; effectId: string; params: Record<string, unknown> };
