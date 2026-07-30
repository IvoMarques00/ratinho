export type ImageFormat = "png" | "jpeg" | "gif";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const GIF_SIGNATURES = ["GIF87a", "GIF89a"];

function matches(bytes: Uint8Array, offset: number, signature: number[]): boolean {
  if (bytes.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}

/** Sniffs PNG/JPEG/GIF from magic bytes; throws on anything else. */
export function detectImageFormat(bytes: Uint8Array): ImageFormat {
  if (matches(bytes, 0, PNG_SIGNATURE)) return "png";
  if (matches(bytes, 0, JPEG_SIGNATURE)) return "jpeg";
  if (bytes.length >= 6) {
    const header = String.fromCharCode(...bytes.subarray(0, 6));
    if (GIF_SIGNATURES.includes(header)) return "gif";
  }
  throw new Error("Unrecognized image format: expected PNG, JPEG, or GIF");
}
