export class TextureGenerator {
  static generate(
    w: number,
    h: number,
    onDraw: (ctx: CanvasRenderingContext2D) => void
  ): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    onDraw(ctx);
    return canvas;
  }
}
