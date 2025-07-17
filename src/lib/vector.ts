export class Vector {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static get zero(): Vector {
    return new Vector(0, 0);
  }

  static fromAngle(angle: number): Vector {
    return new Vector(Math.cos(angle), Math.sin(angle));
  }

  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y);
  }

  mul(v: number): Vector {
    return new Vector(this.x * v, this.y * v);
  }

  lerp(v: Vector, alpha: number) {
    const x = this.x + (v.x - this.x) * alpha;
    const y = this.y + (v.y - this.y) * alpha;
    return new Vector(x, y);
  }

  clone(): Vector {
    return new Vector(this.x, this.y);
  }
}
