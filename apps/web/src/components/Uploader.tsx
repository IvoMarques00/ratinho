import { detectImageFormat, extractGifFrames } from "ani-core";
import { decodeImageBrowser } from "ani-core/decode/browser";
import { useCallback, useRef, useState } from "react";
import type { SourceState } from "../lib/source";

interface UploaderProps {
  onLoaded: (source: SourceState) => void;
  onError: (message: string) => void;
}

export function Uploader({ onLoaded, onError }: UploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const format = detectImageFormat(bytes);

        if (format === "gif") {
          const frames = extractGifFrames(buffer);
          onLoaded({ kind: "gif", frames, fileName: file.name });
        } else {
          const image = await decodeImageBrowser(buffer);
          onLoaded({ kind: "static", image, fileName: file.name });
        }
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to read this file as an image.");
      } finally {
        setIsLoading(false);
      }
    },
    [onLoaded, onError],
  );

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        isDragOver ? "border-sky-400 bg-sky-950/30" : "border-neutral-700 bg-neutral-900/40"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
    >
      <p className="text-sm text-neutral-300">
        Drop a <span className="font-medium text-neutral-100">PNG, JPEG, or GIF</span> here, or
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
      >
        {isLoading ? "Loading…" : "Choose an image"}
      </button>
      <p className="text-xs text-neutral-500">Nothing leaves your browser — all conversion happens locally.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
