import { Vector } from "../lib/ignite";

export enum Player {
  One,
  Two,
}

export const Direction = {
  None: Vector.zero,
  Up: { x: 0, y: -1 },
  Down: { x: 0, y: 1 },
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 },
} as const;
