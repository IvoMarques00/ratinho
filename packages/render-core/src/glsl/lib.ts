/**
 * Small reusable GLSL stdlib. assemble.ts inlines only the chunks an
 * effect's fragment source actually references (word-boundary match on
 * the key), so effects don't pay for functions they don't use.
 */
export const GLSL_LIB: Record<string, string> = {
  TAU: `const float TAU = 6.283185307179586;\n`,
  rot2: `mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }\n`,
  luma: `float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }\n`,
  premultiplyColor: `vec4 premultiplyColor(vec4 c) { return vec4(c.rgb * c.a, c.a); }\n`,
  unpremultiplyColor: `vec3 unpremultiplyColor(vec4 c) { return c.a > 0.0 ? c.rgb / c.a : vec3(0.0); }\n`,
  sampleClamped: `vec4 sampleClamped(sampler2D tex, vec2 uv) { return (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) ? vec4(0.0) : texture(tex, uv); }\n`,
  hash12: `float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }\n`,
};
