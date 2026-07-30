/** Shared fullscreen-triangle vertex shader. vUv is top-left-origin, matching RGBAImage's row-major top-down convention. */
export const VERTEX_SHADER_SOURCE = `#version 300 es
layout(location=0) in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

/** Fragment shader header: version/precision, varyings, and the always-available built-in uniforms. */
export const FRAGMENT_PRELUDE = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vUv;
out vec4 fragColor;

uniform float uPhase;
uniform float uTime;
uniform int uFrame;
uniform int uFrameCount;
uniform vec2 uResolution;
uniform vec2 uTexel;
uniform float uSupersample;
uniform float uSeed;
uniform float uContentScale;
`;
