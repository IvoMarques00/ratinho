import type { CursorSize, Hotspot } from "ani-core";
import { useState } from "react";
import { ExportPanel } from "./components/ExportPanel";
import { HotspotPicker } from "./components/HotspotPicker";
import { LivePreview } from "./components/LivePreview";
import { StylePicker } from "./components/StylePicker";
import { Uploader } from "./components/Uploader";
import type { AnimationMode } from "./lib/animationMode";
import type { SourceState } from "./lib/source";
import { useBakedFrames } from "./lib/useBakedFrames";

function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export default function App() {
  const [source, setSource] = useState<SourceState>({ kind: "none" });
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<AnimationMode>({ engine: "classic", style: "pulse", params: {} });
  const [frameCount, setFrameCount] = useState(8);
  const [fps, setFps] = useState(12);
  const [sizes, setSizes] = useState<CursorSize[]>([32]);
  const [hotspot, setHotspot] = useState<Hotspot | null>(null);

  const baseSize = sizes[0] ?? 32;

  const baked = useBakedFrames(source, mode, frameCount, fps, baseSize);
  const frames = baked.frames;

  const resolvedHotspot = hotspot ?? { x: Math.floor(baseSize / 2), y: Math.floor(baseSize / 2) };
  const firstFrame = frames?.[0] ?? null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-5">
        <h1 className="text-lg font-semibold">Ratinho — Image → .ANI Cursor Converter</h1>
        <p className="text-sm text-neutral-500">
          High-fidelity Windows animated cursors from a JPG, PNG, or GIF. Runs entirely in your browser.
        </p>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Uploader
            onLoaded={(s) => {
              setSource(s);
              setError(null);
              setHotspot(null);
            }}
            onError={setError}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}

          {source.kind !== "none" && (
            <StylePicker
              source={source}
              mode={mode}
              onModeChange={setMode}
              frameCount={frameCount}
              onFrameCountChange={setFrameCount}
              fps={fps}
              onFpsChange={setFps}
              sizes={sizes}
              onSizesChange={setSizes}
            />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <LivePreview frames={frames} baseSize={baseSize} status={baked.status} />
          {baked.status === "error" && baked.error && <p className="text-sm text-red-400">{baked.error}</p>}

          {firstFrame && (
            <HotspotPicker frame={firstFrame} baseSize={baseSize} hotspot={resolvedHotspot} onChange={setHotspot} />
          )}

          <ExportPanel
            frames={frames}
            sizes={sizes}
            hotspot={resolvedHotspot}
            fileNameBase={source.kind === "none" ? "cursor" : baseName(source.fileName)}
          />
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-neutral-600">
        Also available headlessly via the <code>image-to-ani</code> Claude skill — same converter, no browser needed.
      </footer>
    </div>
  );
}
