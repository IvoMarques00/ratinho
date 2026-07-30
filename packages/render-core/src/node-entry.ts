// Node-only entry point. Never import this from browser code — it uses
// node:fs/node:path and a dynamic import() of the optional
// "playwright-core" dependency, none of which belong in a web bundle.
export { renderFramesHeadless } from "./node/headless.js";
export type { RenderFramesHeadlessOptions } from "./node/headless.js";
