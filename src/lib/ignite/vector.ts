export type vector = { x: number; y: number };

export const Vector = {
  new(x: number, y: number): vector {
    return { x: x, y: y };
  },

  get zero(): vector {
    return { x: 0, y: 0 };
  },

  fromAngle(angle: number): vector {
    return { x: Math.cos(angle), y: Math.sin(angle) };
  },

  add(a: vector, b: vector): vector {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  sub(a: vector, b: vector): vector {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  mul(a: vector, scalar: number): vector {
    return { x: a.x * scalar, y: a.y * scalar };
  },

  lerp(a: vector, b: vector, alpha: number): vector {
    return {
      x: a.x + (b.x - a.x) * alpha,
      y: a.y + (b.y - a.y) * alpha,
    };
  },

  clone(v: vector): vector {
    return { x: v.x, y: v.y };
  },

  length(v: vector): number {
    return Math.hypot(v.x, v.y);
  },

  normalize(v: vector): vector {
    const len = Vector.length(v);
    return len === 0 ? { x: 0, y: 0 } : Vector.mul(v, 1 / len);
  },
};
