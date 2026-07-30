/**
 * Cheap, GPU-free lints that catch the most common effect-authoring
 * mistakes via source-text heuristics — not a real GLSL parser, but good
 * enough to fail a unit test before anything ever reaches a shader
 * compiler.
 */

/** Names matching the `u<Capital>...` convention that are used but never `uniform`-declared in the given (already-assembled) source. */
export function findPossiblyUndeclaredUniforms(assembledSource: string): string[] {
  const declared = new Set<string>();
  const declRegex = /uniform\s+\w+\s+(\w+)\s*;/g;
  for (const m of assembledSource.matchAll(declRegex)) {
    declared.add(m[1]!);
  }

  const used = new Set<string>();
  for (const m of assembledSource.matchAll(/\bu[A-Z]\w*\b/g)) {
    used.add(m[0]);
  }

  return Array.from(used).filter((name) => !declared.has(name)).sort();
}

const ALLOWED_PHASE_CONTEXT_PATTERNS = [
  /TAU\s*\*\s*[\w.().]+\s*\*\s*uPhase/,
  /fract\([^)]*uPhase[^)]*\)/,
];

/**
 * Flags `uPhase` usages that don't visibly appear inside an allowed
 * periodic pattern (`TAU * <k> * uPhase` or `fract(...uPhase...)`) —
 * heuristic enforcement of the "must loop seamlessly" authoring
 * invariant. False positives are possible for unusual but valid
 * formulations; false negatives are possible too. It's a lint, not a
 * proof.
 */
export function lintPhaseUsage(fragmentBody: string): string[] {
  const issues: string[] = [];
  for (const occ of fragmentBody.matchAll(/uPhase/g)) {
    const index = occ.index ?? 0;
    const context = fragmentBody.slice(Math.max(0, index - 60), index + 20);
    const ok = ALLOWED_PHASE_CONTEXT_PATTERNS.some((re) => re.test(context));
    if (!ok) {
      issues.push(`uPhase used outside an allowed periodic pattern near: "...${context.trim()}..."`);
    }
  }
  return issues;
}
