/** Growable little-endian byte buffer writer used by the ICO/CUR and ANI encoders. */
export class BinaryWriter {
  private chunks: Uint8Array[] = [];
  private byteLength = 0;

  get length(): number {
    return this.byteLength;
  }

  private push(bytes: Uint8Array): void {
    this.chunks.push(bytes);
    this.byteLength += bytes.length;
  }

  u8(value: number): this {
    this.push(Uint8Array.of(value & 0xff));
    return this;
  }

  u16(value: number): this {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, value, true);
    this.push(b);
    return this;
  }

  u32(value: number): this {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, value, true);
    this.push(b);
    return this;
  }

  /** Writes an ASCII FourCC/tag, e.g. "RIFF". Must be exactly 4 characters. */
  fourCC(tag: string): this {
    if (tag.length !== 4) {
      throw new Error(`fourCC tag must be exactly 4 characters, got ${JSON.stringify(tag)}`);
    }
    const b = new Uint8Array(4);
    for (let i = 0; i < 4; i++) b[i] = tag.charCodeAt(i);
    this.push(b);
    return this;
  }

  bytes(data: Uint8Array): this {
    this.push(data);
    return this;
  }

  /** Pads with a single zero byte if the buffer's current length is odd (RIFF word-alignment). */
  padToEven(): this {
    if (this.byteLength % 2 !== 0) this.u8(0);
    return this;
  }

  toUint8Array(): Uint8Array {
    const out = new Uint8Array(this.byteLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}
