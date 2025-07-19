type Drawable = HTMLImageElement | HTMLCanvasElement;

export class TextureHelper {
  /**
   * Generate a texture.
   * @param w The target width, in pixels.
   * @param h The target height, in pixels.
   * @param onDraw Use this function to draw on the context.
   * @returns A HTML canvas with the generated texture.
   */
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

  /**
   * Stretch an image using a 9-patch mechanism.
   * @param image The image to stretch.
   * @param w The target width.
   * @param h The target height.
   * @param border The border value is used to determine the corners of the
   * 9-patch image. Pixels from 0-{border}, {border-w}, {border}-h will not be
   * stretched.
   * @returns A stretched image.
   */
  static stretch(
    image: Drawable,
    w: number,
    h: number,
    border: number = 10
  ): HTMLCanvasElement {
    const sw = image.width;
    const sh = image.height;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    const dx = [0, border, w - border, w];
    const dy = [0, border, h - border, h];
    const sx = [0, border, sw - border, sw];
    const sy = [0, border, sh - border, sh];

    // Draw 9 regions.
    for (let yi = 0; yi < 3; yi++) {
      for (let xi = 0; xi < 3; xi++) {
        const sX = sx[xi];
        const sY = sy[yi];
        const sW = sx[xi + 1] - sx[xi];
        const sH = sy[yi + 1] - sy[yi];

        const dX = dx[xi];
        const dY = dy[yi];
        const dW = dx[xi + 1] - dx[xi];
        const dH = dy[yi + 1] - dy[yi];

        ctx.drawImage(image, sX, sY, sW, sH, dX, dY, dW, dH);
      }
    }

    return canvas;
  }
}
