import { Size } from "../math/size";
import { Vector } from "../math/vector";

function circleIntersectsRect(circle: Circle, rect: Rect): boolean {
  const cx = circle.xMid;
  const cy = circle.yMid;
  const r = circle.radius;

  // Clamp circle center to rectangle bounds
  const closestX = Math.max(rect.x1, Math.min(cx, rect.x2));
  const closestY = Math.max(rect.y1, Math.min(cy, rect.y2));

  const dx = cx - closestX;
  const dy = cy - closestY;

  return dx * dx + dy * dy < r * r;
}

/**
 * Subclasses of Shape can be used for basic collision detection.
 */
export abstract class Shape {
  protected _pos: Vector;

  get pos(): Vector {
    return this._pos;
  }

  get x(): number {
    return this._pos.x;
  }

  get y(): number {
    return this._pos.y;
  }

  set pos(v: Vector) {
    this._pos = v;
  }

  constructor(pos: Vector) {
    this._pos = pos;
  }

  abstract intersects(shape: Shape): boolean;

  abstract containsPoint(v: Vector): boolean;
}

export class Rect extends Shape {
  private _size: Size;

  get size(): Size {
    return this._size;
  }

  get x1(): number {
    return this._pos.x;
  }

  get xMid(): number {
    return this._pos.x + this._size.w / 2;
  }

  get x2(): number {
    return this._pos.x + this._size.w;
  }

  get y1(): number {
    return this._pos.y;
  }

  get yMid(): number {
    return this._pos.y + this._size.h / 2;
  }

  get y2(): number {
    return this._pos.y + this._size.h;
  }

  get w(): number {
    return this.size.w;
  }

  get h(): number {
    return this.size.h;
  }

  constructor(pos: Vector, size: Size) {
    super(pos);

    this._size = size;
  }

  static get zero() {
    return new Rect(Vector.zero, Size.zero);
  }

  intersects(shape: Shape): boolean {
    if (shape instanceof Circle) {
      return circleIntersectsRect(shape, this);
    }

    throw new Error(`Intersect check not implemented for ${shape}.`);
  }

  containsPoint(v: Vector): boolean {
    return v.x >= this.x1 && v.x <= this.x2 && v.y >= this.y1 && v.y <= this.y2;
  }
}

export class Circle extends Shape {
  private _radius: number;

  get radius(): number {
    return this._radius;
  }

  get xMin(): number {
    return this._pos.x;
  }

  get xMax(): number {
    return this._pos.x + this._radius * 2;
  }

  get xMid(): number {
    return this._pos.x + this._radius;
  }

  get yMin(): number {
    return this._pos.y;
  }

  get yMid(): number {
    return this._pos.y + this._radius;
  }

  get yMax(): number {
    return this._pos.y + this._radius * 2;
  }

  constructor(pos: Vector, radius: number) {
    super(pos);

    this._radius = radius;
  }

  intersects(shape: Shape): boolean {
    if (shape instanceof Rect) {
      return circleIntersectsRect(this, shape);
    }

    throw new Error(`Intersect check not implemented for ${shape}.`);
  }

  containsPoint(v: Vector): boolean {
    const dx = this.xMid - v.x;
    const dy = this.yMid - v.y;
    return dx * dx + dy * dy <= Math.pow(this.radius, 2);
  }
}
