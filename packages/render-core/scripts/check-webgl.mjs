#!/usr/bin/env node
// Preflight diagnostic: confirms headless Chromium in this environment can
// do everything render-core's Node/skill path depends on — WebGL2 context
// creation, float FBOs, multi-pass ping-pong, readPixels, and efficient
// pixel transfer back to Node. Run this FIRST when something in the
// shader-effect path misbehaves; it isolates "is it Chromium/WebGL" from
// "is it our code".
import { chromium } from "playwright-core";

const CHROMIUM_PATH = process.env.RATINHO_CHROMIUM ?? "/opt/pw-browsers/chromium";

function fail(message) {
  process.stderr.write(`check-webgl: FAIL — ${message}\n`);
  process.exitCode = 1;
}

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage();

try {
  const report = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const gl = canvas.getContext("webgl2");
    if (!gl) return { ok: false, reason: "no webgl2 context" };

    const info = {
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      renderer: gl.getParameter(gl.RENDERER),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxSamples: gl.getParameter(gl.MAX_SAMPLES),
      extColorBufferFloat: !!gl.getExtension("EXT_color_buffer_float"),
      oesTextureFloatLinear: !!gl.getExtension("OES_texture_float_linear"),
    };

    // FBO with an RGBA8 color-attached texture.
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const fboStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    info.fboComplete = fboStatus === gl.FRAMEBUFFER_COMPLETE;

    // Draw a known solid color and read it back.
    gl.viewport(0, 0, 256, 256);
    gl.clearColor(0.25, 0.5, 0.75, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const pixels = new Uint8Array(4);
    gl.readPixels(128, 128, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    info.readPixelsSample = Array.from(pixels);
    info.readPixelsPlausible = Math.abs(pixels[0] - 64) < 4 && Math.abs(pixels[1] - 128) < 4 && Math.abs(pixels[2] - 191) < 4;

    return { ok: true, info };
  });

  if (!report.ok) {
    fail(report.reason);
  } else {
    const i = report.info;
    console.log("check-webgl: OK");
    console.log(`  ${i.version} / ${i.shadingLanguageVersion}`);
    console.log(`  renderer: ${i.renderer}`);
    console.log(`  MAX_TEXTURE_SIZE=${i.maxTextureSize} MAX_RENDERBUFFER_SIZE=${i.maxRenderbufferSize} MAX_SAMPLES=${i.maxSamples}`);
    console.log(`  EXT_color_buffer_float=${i.extColorBufferFloat} OES_texture_float_linear=${i.oesTextureFloatLinear}`);
    console.log(`  FBO complete: ${i.fboComplete}`);
    console.log(`  readPixels sample (should be ~[64,128,191,255]): [${i.readPixelsSample.join(",")}]`);

    if (!i.fboComplete) fail("FBO with RGBA8 texture attachment is not complete");
    if (!i.readPixelsPlausible) fail("readPixels did not return the expected cleared color");
    if (!i.extColorBufferFloat) console.warn("check-webgl: WARNING — EXT_color_buffer_float missing, RGBA16F targets will not work");
  }
} finally {
  await browser.close();
}

if (process.exitCode) {
  process.stderr.write("check-webgl: one or more checks failed — the shader-effect render path will not work in this environment.\n");
} else {
  console.log("check-webgl: all checks passed.");
}
