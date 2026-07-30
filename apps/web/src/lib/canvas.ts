export function drawCheckerboard(ctx: CanvasRenderingContext2D, size: number, cell = 2): void {
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      ctx.fillStyle = (x / cell + y / cell) % 2 === 0 ? "#2a2a2a" : "#1a1a1a";
      ctx.fillRect(x, y, cell, cell);
    }
  }
}
