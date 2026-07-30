import { describe, expect, it } from "vitest";
import { BinaryWriter } from "../src/encode/binary-writer.js";

describe("BinaryWriter", () => {
  it("writes u8/u16/u32 little-endian", () => {
    const w = new BinaryWriter();
    w.u8(0xab).u16(0x1234).u32(0xdeadbeef);
    const bytes = w.toUint8Array();
    expect(Array.from(bytes)).toEqual([0xab, 0x34, 0x12, 0xef, 0xbe, 0xad, 0xde]);
  });

  it("writes a 4-character fourCC tag", () => {
    const w = new BinaryWriter();
    w.fourCC("RIFF");
    expect(Array.from(w.toUint8Array())).toEqual([0x52, 0x49, 0x46, 0x46]);
  });

  it("rejects fourCC tags that are not exactly 4 characters", () => {
    const w = new BinaryWriter();
    expect(() => w.fourCC("ABC")).toThrow();
    expect(() => w.fourCC("ABCDE")).toThrow();
  });

  it("pads to an even length only when odd", () => {
    const w1 = new BinaryWriter();
    w1.u8(1).u8(2).u8(3);
    expect(w1.length).toBe(3);
    w1.padToEven();
    expect(w1.length).toBe(4);
    expect(w1.toUint8Array().at(-1)).toBe(0);

    const w2 = new BinaryWriter();
    w2.u8(1).u8(2);
    w2.padToEven();
    expect(w2.length).toBe(2);
  });

  it("tracks length as data is appended", () => {
    const w = new BinaryWriter();
    expect(w.length).toBe(0);
    w.bytes(new Uint8Array(10));
    expect(w.length).toBe(10);
  });
});
