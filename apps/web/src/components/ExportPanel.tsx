import { convertImageToCur, encodeIco, framesToAni, resizeRGBA } from "ani-core";
import type { CursorSize, Frame, Hotspot } from "ani-core";
import { useState } from "react";
import { downloadBytes } from "../lib/download";

interface ExportPanelProps {
  frames: Frame[] | null;
  sizes: CursorSize[];
  hotspot: Hotspot;
  fileNameBase: string;
}

export function ExportPanel({ frames, sizes, hotspot, fileNameBase }: ExportPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const disabled = !frames || frames.length === 0;

  function guard(fn: () => void) {
    try {
      setError(null);
      fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-neutral-200">Export</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            guard(() => {
              const { bytes } = framesToAni(frames!, { sizes, hotspot });
              downloadBytes(bytes, `${fileNameBase}.ani`);
            })
          }
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download .ani
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            guard(() => {
              const bytes = convertImageToCur(frames![0]!, { sizes, hotspot });
              downloadBytes(bytes, `${fileNameBase}.cur`);
            })
          }
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download .cur (frame 1)
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            guard(() => {
              const images = sizes.map((size) => resizeRGBA(frames![0]!, size, size));
              const bytes = encodeIco(images);
              downloadBytes(bytes, `${fileNameBase}.ico`);
            })
          }
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download .ico (bonus)
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
