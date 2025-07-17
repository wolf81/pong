export class Size {
  readonly w: number;
  readonly h: number;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  static get zero(): Size {
    return new Size(0, 0);
  }
}
