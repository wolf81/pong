import { CANVAS_H, CANVAS_W } from "../constants";
import { Paddle, Ball } from "../core/entity";
import { Direction, Player } from "../core/types";
import { Renderer } from "../lib/renderer";
import { TextureHelper } from "../helpers/texture_helper";
import { AssetLoader } from "../lib/asset_loader";
import { InputListener } from "../lib/input_listener";
import { Scene } from "../lib/scene_manager";
import { ServiceLocator } from "../lib/service_locator";
import { Vector } from "../math/vector";
import { AudioHelper } from "../helpers/audio_helper";

const PADDLE_MARGIN = 10;
const CPU_PADDLE_TOLERANCE = 5;

function newPaddle(player: Player): Paddle {
  const assetLoader = ServiceLocator.resolve(AssetLoader);

  switch (player) {
    case Player.One: {
      const paddle = new Paddle(
        assetLoader.getImage("paddleBlu"),
        Vector.zero,
        Player.One
      );
      paddle.pos = new Vector(PADDLE_MARGIN, (CANVAS_H - paddle.size.h) / 2);
      return paddle;
    }
    case Player.Two: {
      const paddle = new Paddle(
        assetLoader.getImage("paddleRed"),
        Vector.zero,
        Player.Two
      );
      paddle.pos = new Vector(
        CANVAS_W - paddle.size.w - PADDLE_MARGIN,
        (CANVAS_H - paddle.size.h) / 2
      );
      return paddle;
    }
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(Math.min(v, max), min);
}

function newBall(): Ball {
  const assetLoader = ServiceLocator.resolve(AssetLoader);

  const sprite = assetLoader.getImage("ballGrey");
  const pos = new Vector(
    (CANVAS_W - sprite.width) / 2,
    (CANVAS_H - sprite.height) / 2
  );
  const ball = new Ball(sprite, pos);

  let angle = ((Math.random() - 0.5) * Math.PI) / 1.5;
  angle += Math.random() > 0.5 ? 0 : Math.PI;
  ball.dir = Vector.fromAngle(angle);

  return ball;
}

export class GamePlayScene extends Scene {
  private _inputListener: InputListener;

  private _background!: HTMLCanvasElement;
  private _player1: Paddle = newPaddle(Player.One);
  private _player2: Paddle = newPaddle(Player.Two);
  private _ball: Ball = newBall();

  constructor() {
    super();
    this._inputListener = ServiceLocator.resolve(InputListener);
  }

  async init(): Promise<void> {
    const assetLoader = ServiceLocator.resolve(AssetLoader);
    const image = assetLoader.getImage("texture_08");
    this._background = TextureHelper.generate(CANVAS_W, CANVAS_H, (ctx) => {
      for (let x = 0; x < ctx.canvas.width; x += image.width) {
        for (let y = 0; y < ctx.canvas.height; y += image.height) {
          ctx.drawImage(image, x, y);
        }
      }
    });
  }

  update(dt: number): void {
    this._player1.dir = Direction.None;
    if (this._inputListener.isKeyDown("w")) {
      this._player1.dir = Direction.Up;
    }
    if (this._inputListener.isKeyDown("s")) {
      this._player1.dir = Direction.Down;
    }

    this._player2.dir = Direction.None;
    if (this._ball.dir.x > 0) {
      const delta = this._player2.shape.yMid - this._ball.shape.yMid;

      if (Math.abs(delta) > CPU_PADDLE_TOLERANCE) {
        this._player2.dir = delta > 0 ? Direction.Up : Direction.Down;
      }
    }

    this._player1.update(dt);
    this._player2.update(dt);
    this._ball.update(dt);

    if (this._ball.pos.y < 0) {
      this._ball.pos.y = 0;
      this._ball.dir.y = -this._ball.dir.y;
      AudioHelper.playRandomImpactSound(this._ball.speed);
    }

    if (this._ball.pos.y > CANVAS_H - this._ball.size.h) {
      this._ball.pos.y = CANVAS_H - this._ball.size.h;
      this._ball.dir.y = -this._ball.dir.y;
      AudioHelper.playRandomImpactSound(this._ball.speed);
    }

    if (this._ball.shape.x + this._ball.size.w < 0) {
      this._ball = newBall();
      this._player2.score += 1;
    }

    if (this._ball.shape.x > CANVAS_W) {
      this._ball = newBall();
      this._player1.score += 1;
    }

    for (let player of [this._player1, this._player2]) {
      player.pos.y = clamp(player.pos.y, 0, CANVAS_H - player.size.h);

      if (this._ball.collidesWith(player)) {
        // Adjust vertical deflection.
        const hitY =
          (this._ball.shape.yMid - player.shape.yMid) / (player.size.h / 2);
        const maxBounce = Math.PI / 3; // Limit angle to 60°.

        let angle = 0;
        if (player === this._player1) {
          angle = hitY * maxBounce;
        } else {
          angle = Math.PI - hitY * maxBounce;
        }

        this._ball.dir = Vector.fromAngle(angle);
        this._ball.increaseSpeed();
        AudioHelper.playRandomImpactSound(this._ball.speed);
      }
    }
  }

  draw(renderer: Renderer): void {
    renderer.drawImage(this._background, 0, 0);

    const text = `${this._player1.score} vs ${this._player2.score}`;

    renderer.drawText(text, CANVAS_W / 2, 48, {
      font: "48px Jumpman",
      color: "#ffffff",
      align: "center",
    });

    this._player1.draw(renderer);
    this._player2.draw(renderer);
    this._ball?.draw(renderer);
  }
}
