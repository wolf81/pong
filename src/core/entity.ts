import { Vector, Renderer, Runloop, Shape, Rect, Circle } from "../lib/ignite";
import { Player } from "./types";

type Size = { w: number; h: number };

/**
 * Base speed for both paddle & ball in pixels per second.
 */
const BASE_SPEED = 60;

export abstract class Entity {
  protected _prevPos: Vector;

  get prevPos(): Vector {
    return this._prevPos;
  }

  readonly sprite: HTMLImageElement;

  pos: Vector = { x: 0, y: 0 };
  size: { w: number; h: number };
  isVisible: boolean = true;

  constructor(texture: HTMLImageElement, pos?: Vector) {
    this.sprite = texture;

    this.pos = pos ?? { x: 0, y: 0 };
    this._prevPos = Vector.clone(this.pos);
    this.size = { w: texture.width, h: texture.height };
  }

  update(_: number): void {
    this._prevPos = Vector.clone(this.pos);
  }

  draw(renderer: Renderer) {
    if (!this.isVisible) return;

    const pos = Vector.lerp(this._prevPos, this.pos, Runloop.alpha);
    renderer.drawImage(this.sprite, Math.floor(pos.x), Math.floor(pos.y));
  }
}

export abstract class Actor<T extends Shape> extends Entity {
  dir: Vector = Vector.zero;
  speed: number = 8;

  abstract get shape(): T;

  update(dt: number): void {
    super.update(dt);

    const dxy = Vector.mul(this.dir, this.speed * BASE_SPEED * dt);
    this.pos = Vector.add(this.pos, dxy);
    this.shape.x = this.pos.x;
    this.shape.y = this.pos.y;
  }

  collidesWith(actor: Actor<any>): boolean {
    return Shape.intersects(this.shape, actor.shape);
  }
}

export class Paddle extends Actor<Rect> {
  private readonly _shape: Rect;

  get shape(): Rect {
    return this._shape;
  }

  readonly player: Player;

  score: number = 0;

  constructor(texture: HTMLImageElement, pos: Vector, player: Player) {
    super(texture, pos);

    this.player = player;
    this._shape = Shape.rect(this.pos.x, pos.y, this.size.w, this.size.h);
  }
}

export class Ball extends Actor<Circle> {
  private readonly _shape: Circle;

  alpha: number = 1.0;

  get shape(): Circle {
    return this._shape;
  }

  constructor(texture: HTMLImageElement, pos: Vector) {
    super(texture, pos);

    const radius = this.sprite.width / 2;
    this._shape = Shape.circle(this.pos.x, pos.y, radius);
  }

  increaseSpeed() {
    this.speed = Math.min(this.speed + 1, 20);
  }

  override draw(renderer: Renderer): void {
    super.draw(renderer);
  }
}
