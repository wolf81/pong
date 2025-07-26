import { Vector } from "./vector";

export class Camera {
  pos: Vector = Vector.zero;
  scale: number = 1;

  applyTransform(ctx: CanvasRenderingContext2D) {
    ctx.translate(-this.pos.x * this.scale, -this.pos.y * this.scale);
    ctx.scale(this.scale, this.scale);
  }

  toWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX / this.scale + this.pos.x,
      y: screenY / this.scale + this.pos.y,
    };
  }

  toScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.pos.x) * this.scale,
      y: (worldY - this.pos.y) * this.scale,
    };
  }
}
