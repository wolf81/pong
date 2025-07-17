import { Vector } from "../lib/vector";

export enum Player {
  One,
  Two,
}

export const Direction = {
  None: Vector.zero,
  Up: new Vector(0, -1),
  Down: new Vector(0, 1),
  Left: new Vector(-1, 0),
  Right: new Vector(1, 0),
} as const;
