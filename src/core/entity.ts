import { Renderer } from "../lib/renderer";
import { Runloop } from "../lib/runloop";
import { Size } from "../lib/size";
import { Vector } from "../lib/vector";
import { Circle, Rect, Shape } from "../lib/shape";
import { Player } from "./types";

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

  pos: Vector = Vector.zero;
  size: Size;
  isVisible: boolean = true;

  constructor(texture: HTMLImageElement, pos?: Vector) {
    this.sprite = texture;

    this.pos = pos ?? Vector.zero;
    this._prevPos = this.pos.clone();
    this.size = new Size(texture.width, texture.height);
  }

  update(_: number): void {
    this._prevPos = this.pos.clone();
  }

  draw(renderer: Renderer) {
    if (!this.isVisible) return;

    const pos = this.prevPos.lerp(this.pos, Runloop.alpha);
    renderer.drawImage(this.sprite, Math.floor(pos.x), Math.floor(pos.y));
  }
}

export abstract class Actor<T extends Shape> extends Entity {
  dir: Vector = Vector.zero;
  speed: number = 8;

  abstract get shape(): T;

  update(dt: number): void {
    super.update(dt);

    const dxy = this.dir.mul(this.speed * BASE_SPEED * dt);
    this.pos = this.pos.add(dxy);
    this.shape.pos = this.pos;
  }

  collidesWith(actor: Actor<any>): boolean {
    return this.shape.intersects(actor.shape);
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
    this._shape = new Rect(this.pos, this.size);
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
    this._shape = new Circle(this.pos, radius);
  }

  increaseSpeed() {
    this.speed = Math.min(this.speed + 1, 20);
  }

  override draw(renderer: Renderer): void {
    super.draw(renderer);
  }
}
