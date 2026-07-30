export function sinc(x: number): number {
  if (x === 0) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

/** Lanczos-a windowed sinc kernel. Zero outside [-a, a]. */
export function lanczos(x: number, a: number): number {
  if (x <= -a || x >= a) return 0;
  return sinc(x) * sinc(x / a);
}
