/**
 * Minimal test-only reader for RIFF/ANI and ICO/CUR bytes, used to
 * round-trip-verify what our own encoders wrote. Not part of the public
 * package API.
 */

export interface ParsedChunk {
  tag: string;
  data: Uint8Array;
}

export function readFourCC(view: DataView, offset: number): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s;
}

export function parseRiffChunks(bytes: Uint8Array, start: number, end: number): ParsedChunk[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: ParsedChunk[] = [];
  let offset = start;
  while (offset < end) {
    const tag = readFourCC(view, offset);
    const size = view.getUint32(offset + 4, true);
    const dataStart = offset + 8;
    const data = bytes.subarray(dataStart, dataStart + size);
    chunks.push({ tag, data });
    offset = dataStart + size;
    if (offset % 2 !== 0) offset += 1; // skip pad byte
  }
  return chunks;
}

export interface ParsedAni {
  cbSizeOf: number;
  cFrames: number;
  cSteps: number;
  jifRate: number;
  flags: number;
  rateJiffies: number[];
  iconBlobs: Uint8Array[];
}

export function parseAni(bytes: Uint8Array): ParsedAni {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffTag = readFourCC(view, 0);
  if (riffTag !== "RIFF") throw new Error(`expected RIFF, got ${riffTag}`);
  const fileSize = view.getUint32(4, true);
  const formType = readFourCC(view, 8);
  if (formType !== "ACON") throw new Error(`expected ACON, got ${formType}`);

  if (fileSize !== bytes.length - 8) {
    throw new Error(`RIFF fileSize mismatch: header says ${fileSize}, actual ${bytes.length - 8}`);
  }

  const topChunks = parseRiffChunks(bytes, 12, bytes.length);
  const anihChunk = topChunks.find((c) => c.tag === "anih");
  const rateChunk = topChunks.find((c) => c.tag === "rate");
  const listChunk = topChunks.find((c) => c.tag === "LIST");
  if (!anihChunk) throw new Error("missing anih chunk");
  if (!rateChunk) throw new Error("missing rate chunk");
  if (!listChunk) throw new Error("missing LIST chunk");

  const anihView = new DataView(
    anihChunk.data.buffer,
    anihChunk.data.byteOffset,
    anihChunk.data.byteLength,
  );
  const cbSizeOf = anihView.getUint32(0, true);
  const cFrames = anihView.getUint32(4, true);
  const cSteps = anihView.getUint32(8, true);
  const jifRate = anihView.getUint32(28, true);
  const flags = anihView.getUint32(32, true);

  const rateView = new DataView(rateChunk.data.buffer, rateChunk.data.byteOffset, rateChunk.data.byteLength);
  const rateJiffies: number[] = [];
  for (let i = 0; i < rateChunk.data.length / 4; i++) {
    rateJiffies.push(rateView.getUint32(i * 4, true));
  }

  const listView = new DataView(listChunk.data.buffer, listChunk.data.byteOffset, listChunk.data.byteLength);
  const listType = readFourCC(listView, 0);
  if (listType !== "fram") throw new Error(`expected fram LIST type, got ${listType}`);
  const framChunks = parseRiffChunks(listChunk.data, 4, listChunk.data.length);
  const iconBlobs = framChunks.filter((c) => c.tag === "icon").map((c) => c.data);

  return { cbSizeOf, cFrames, cSteps, jifRate, flags, rateJiffies, iconBlobs };
}

export interface ParsedIconDirEntry {
  width: number;
  height: number;
  a: number; // wXHotspot or wPlanes depending on idType
  b: number; // wYHotspot or wBitCount depending on idType
  bytesInRes: number;
  imageOffset: number;
}

export interface ParsedIcon {
  idType: number;
  entries: ParsedIconDirEntry[];
  dibHeaders: { biHeight: number; biBitCount: number; biWidth: number }[];
}

export function parseIcon(bytes: Uint8Array): ParsedIcon {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const reserved = view.getUint16(0, true);
  if (reserved !== 0) throw new Error("ICONDIR reserved field must be 0");
  const idType = view.getUint16(2, true);
  const idCount = view.getUint16(4, true);

  const entries: ParsedIconDirEntry[] = [];
  for (let i = 0; i < idCount; i++) {
    const off = 6 + i * 16;
    const bWidth = view.getUint8(off);
    const bHeight = view.getUint8(off + 1);
    const a = view.getUint16(off + 4, true);
    const b = view.getUint16(off + 6, true);
    const bytesInRes = view.getUint32(off + 8, true);
    const imageOffset = view.getUint32(off + 12, true);
    entries.push({
      width: bWidth === 0 ? 256 : bWidth,
      height: bHeight === 0 ? 256 : bHeight,
      a,
      b,
      bytesInRes,
      imageOffset,
    });
  }

  const dibHeaders = entries.map((e) => {
    const biWidth = view.getUint32(e.imageOffset + 4, true);
    const biHeight = view.getUint32(e.imageOffset + 8, true);
    const biBitCount = view.getUint16(e.imageOffset + 14, true);
    return { biWidth, biHeight, biBitCount };
  });

  return { idType, entries, dibHeaders };
}
