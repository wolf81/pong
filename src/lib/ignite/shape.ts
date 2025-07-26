import { Vector } from "./vector";

export type Rect = { kind: "rect"; x: number; y: number; w: number; h: number };
export type Circle = { kind: "circle"; x: number; y: number; r: number };
export type Shape = Rect | Circle;

export const Shape = {
  rect(x: number, y: number, w: number, h: number): Rect {
    return { kind: "rect", x: x, y: y, w: w, h: h };
  },

  circle(x: number, y: number, r: number): Circle {
    return { kind: "circle", x: x, y: y, r: r };
  },

  min(shape: Shape): Vector {
    return { x: shape.x, y: shape.y };
  },

  mid(shape: Shape): Vector {
    switch (shape.kind) {
      case "circle":
        return { x: shape.x + shape.r, y: shape.y + shape.r };
      case "rect":
        return { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
    }
  },

  max(shape: Shape): Vector {
    switch (shape.kind) {
      case "circle":
        return { x: shape.x + shape.r * 2, y: shape.y + shape.r * 2 };
      case "rect":
        return { x: shape.x + shape.w, y: shape.y + shape.h };
    }
  },

  containsPoint(shape: Shape, p: Vector): boolean {
    switch (shape.kind) {
      case "circle":
        return circleContainsPoint(shape, p);
      case "rect":
        return rectContainsPoint(shape, p);
    }
  },

  intersects(shape1: Shape, shape2: Shape): boolean {
    switch (shape1.kind) {
      case "rect":
        switch (shape2.kind) {
          case "rect":
            return rectIntersectsRect(shape1, shape2);
          case "circle":
            return circleIntersectsRect(shape2, shape1);
        }
      case "circle":
        switch (shape2.kind) {
          case "rect":
            return circleIntersectsRect(shape1, shape2);
          case "circle":
            return circleIntersectsCircle(shape1, shape2);
        }
    }
  },
};

// Private

function rectContainsPoint(rect: Rect, point: Vector): boolean {
  const x2 = rect.x + rect.w;
  const y2 = rect.y + rect.h;
  return (
    point.x >= rect.x && point.x <= x2 && point.y >= rect.y && point.y <= y2
  );
}

function circleContainsPoint(circle: Circle, point: Vector): boolean {
  const cx = circle.x + circle.r;
  const cy = circle.y + circle.r;
  const dx = cx - point.x;
  const dy = cy - point.y;
  return dx * dx + dy * dy <= Math.pow(circle.r, 2);
}

function circleIntersectsCircle(circle1: Circle, circle2: Circle): boolean {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const dxy = dx * dx + dy * dy;
  const radiusSum = circle1.r + circle2.r;
  return dxy < radiusSum * radiusSum;
}

function circleIntersectsRect(circle: Circle, rect: Rect): boolean {
  const cx = circle.x + circle.r;
  const cy = circle.y + circle.r;
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function rectIntersectsRect(rect1: Rect, rect2: Rect): boolean {
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.y + rect1.h > rect2.y
  );
}
