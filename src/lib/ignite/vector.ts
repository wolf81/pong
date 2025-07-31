export type Vector = { x: number; y: number };

export const Vector = {
  new(x: number, y: number): Vector {
    return { x: x, y: y };
  },

  get zero(): Vector {
    return { x: 0, y: 0 };
  },

  fromAngle(angle: number): Vector {
    return { x: Math.cos(angle), y: Math.sin(angle) };
  },

  add(a: Vector, b: Vector): Vector {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  sub(a: Vector, b: Vector): Vector {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  mul(a: Vector, scalar: number): Vector {
    return { x: a.x * scalar, y: a.y * scalar };
  },

  lerp(a: Vector, b: Vector, alpha: number): Vector {
    return {
      x: a.x + (b.x - a.x) * alpha,
      y: a.y + (b.y - a.y) * alpha,
    };
  },

  clone(v: Vector): Vector {
    return { x: v.x, y: v.y };
  },

  copy(to: Vector, from: Vector) {
    to.x = from.x;
    to.y = from.y;
  },

  length(v: Vector): number {
    return Math.hypot(v.x, v.y);
  },

  normalize(v: Vector): Vector {
    const len = Vector.length(v);
    return len === 0 ? { x: 0, y: 0 } : Vector.mul(v, 1 / len);
  },

  isEqual(v1: Vector, v2: Vector): boolean {
    return v1.x === v2.x && v1.y === v2.y;
  },
};
