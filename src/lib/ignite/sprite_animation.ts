import { Sprite, SpriteSheet } from "./spritesheet";

export type SpriteAnimation = {
  sprites: Sprite[];
  frameDuration: number;
  isLooping: boolean;
};

export type SpriteAnimations = Record<string, SpriteAnimation>;

export type SpriteAnimator = {
  current: string;
  elapsed: number;
  frameIndex: number;
};

export const SpriteAnimator = {
  new(
    current: string,
    elapsed: number = 0,
    frameIndex: number = 0
  ): SpriteAnimator {
    return {
      current: current,
      elapsed: elapsed,
      frameIndex: frameIndex,
    };
  },

  getFrame(animator: SpriteAnimator, animations: SpriteAnimations): Sprite {
    const animation = animations[animator.current];
    return animation.sprites[animator.frameIndex];
  },

  update(animator: SpriteAnimator, animations: SpriteAnimations, dt: number) {
    animator.elapsed += dt;

    const animation = animations[animator.current];

    while (animator.elapsed >= animation.frameDuration) {
      animator.elapsed -= animation.frameDuration;
      animator.frameIndex += 1;

      if (animator.frameIndex >= animation.sprites.length) {
        if (animation.isLooping) {
          animator.frameIndex = 0;
        } else {
          animator.frameIndex = animation.sprites.length - 1;
          break;
        }
      }
    }
  },
};

export const SpriteAnimation = {
  new(
    sheet: SpriteSheet,
    sprites: number[],
    frameDuration: number,
    isLooping: boolean
  ): SpriteAnimation {
    return {
      sprites: sprites.map((index) => sheet.sprites[index]),
      frameDuration: frameDuration,
      isLooping: isLooping,
    };
  },
};
