import { BinaryWriter } from "./binary-writer.js";

const ANIH_SIZE = 36;
const AF_ICON = 0x1;
const JIFFIES_PER_SECOND = 60;

export interface AniFrameInput {
  /** A complete, standalone CUR file (as produced by encodeCur()). */
  cur: Uint8Array;
  delayMs: number;
}

function msToJiffies(ms: number): number {
  return Math.max(1, Math.round((ms * JIFFIES_PER_SECOND) / 1000));
}

function writeChunk(w: BinaryWriter, tag: string, data: Uint8Array): void {
  w.fourCC(tag);
  w.u32(data.length);
  w.bytes(data);
  w.padToEven();
}

/**
 * Assembles a RIFF/ACON .ani file from a sequence of frames. Chunk order is
 * anih -> rate -> LIST 'fram', matching real-world convention. Always
 * emits an explicit `rate` chunk (per-step jiffy counts) rather than
 * relying solely on anih's default JifRate, since per-frame delays
 * (e.g. from an extracted GIF) are frequently non-uniform.
 */
export function buildAni(frames: AniFrameInput[]): Uint8Array {
  if (frames.length === 0) {
    throw new Error("buildAni requires at least one frame");
  }

  const cFrames = frames.length;
  const cSteps = cFrames;
  const jiffies = frames.map((f) => msToJiffies(f.delayMs));
  const avgJiffy = Math.max(
    1,
    Math.round(jiffies.reduce((sum, j) => sum + j, 0) / jiffies.length),
  );

  const anih = new BinaryWriter();
  anih.u32(ANIH_SIZE); // cbSizeOf
  anih.u32(cFrames);
  anih.u32(cSteps);
  anih.u32(0); // cx (reserved)
  anih.u32(0); // cy (reserved)
  anih.u32(0); // cBitCount (reserved)
  anih.u32(0); // cPlanes (reserved)
  anih.u32(avgJiffy); // JifRate (fallback default rate; `rate` chunk below is authoritative)
  anih.u32(AF_ICON); // flags: frames are full icon/cursor resources, no seq chunk

  const rate = new BinaryWriter();
  for (const j of jiffies) rate.u32(j);

  const fram = new BinaryWriter();
  fram.fourCC("fram");
  for (const frame of frames) writeChunk(fram, "icon", frame.cur);

  const body = new BinaryWriter();
  writeChunk(body, "anih", anih.toUint8Array());
  writeChunk(body, "rate", rate.toUint8Array());
  writeChunk(body, "LIST", fram.toUint8Array());

  const content = new BinaryWriter();
  content.fourCC("ACON");
  content.bytes(body.toUint8Array());

  const contentBytes = content.toUint8Array();

  const final = new BinaryWriter();
  final.fourCC("RIFF");
  final.u32(contentBytes.length);
  final.bytes(contentBytes);

  return final.toUint8Array();
}
