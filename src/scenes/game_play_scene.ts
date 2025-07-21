import { CANVAS_H, CANVAS_W } from "../constants";
import { Paddle, Ball } from "../core/entity";
import { Direction, Player } from "../core/types";
import { Renderer } from "../lib/renderer";
import { TextureHelper } from "../helpers/texture_helper";
import { AssetLoader } from "../lib/asset_loader";
import { InputListener } from "../lib/input_listener";
import { Scene, SceneManager } from "../lib/scene_manager";
import { ServiceLocator } from "../lib/service_locator";
import { Vector } from "../lib/vector";
import { AudioHelper } from "../helpers/audio_helper";
import { Timer } from "../lib/timer";
import { GameOverScene } from "./game_over_scene";

const PADDLE_MARGIN = 10;
const CPU_PADDLE_TOLERANCE = 5;
const ROUND_DELAY = 1.6;
const MATCH_POINTS = 5; // The number of points required to win the game.

function generateBackgroundTexture() {
  const assetLoader = ServiceLocator.resolve(AssetLoader);
  const image = assetLoader.getImage("texture_08");
  return TextureHelper.generate(CANVAS_W, CANVAS_H, (ctx) => {
    for (let x = 0; x < ctx.canvas.width; x += image.width) {
      for (let y = 0; y < ctx.canvas.height; y += image.height) {
        ctx.drawImage(image, x, y);
      }
    }
  });
}

function newPaddle(player: Player): Paddle {
  const assetLoader = ServiceLocator.resolve(AssetLoader);

  switch (player) {
    case Player.One: {
      const sprite = assetLoader.getImage("paddleBlu");
      const pos = new Vector(PADDLE_MARGIN, (CANVAS_H - sprite.height) / 2);
      return new Paddle(sprite, pos, Player.One);
    }
    case Player.Two: {
      const sprite = assetLoader.getImage("paddleRed");
      const pos = new Vector(
        CANVAS_W - sprite.width - PADDLE_MARGIN,
        (CANVAS_H - sprite.height) / 2
      );
      return new Paddle(sprite, pos, Player.Two);
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

function endGame(winner: Player) {
  const sceneManager = ServiceLocator.resolve(SceneManager);
  sceneManager.push(new GameOverScene(winner));
}

function handleInput(paddle: Paddle, ball: Ball, state: GamePlayState) {
  const inputListener = ServiceLocator.resolve(InputListener);

  paddle.dir = Direction.None;

  switch (paddle.player) {
    // Handle keyboard input
    case Player.One:
      if (inputListener.isKeyDown("w")) {
        paddle.dir = Direction.Up;
      }
      if (inputListener.isKeyDown("s")) {
        paddle.dir = Direction.Down;
      }
      break;
    case Player.Two:
      // When not playing a round, move CPU player to the middle.
      if (state === GamePlayState.EndRound) {
        paddle.dir = Direction.None;
        if (paddle.shape.yMid < CANVAS_H / 2 - CPU_PADDLE_TOLERANCE) {
          paddle.dir = Direction.Down;
        }
        if (paddle.shape.yMid > CANVAS_H / 2 + CPU_PADDLE_TOLERANCE) {
          paddle.dir = Direction.Up;
        }
      }

      // When playing and ball moves towards player, follow ball.
      if (state === GamePlayState.PlayRound && ball.dir.x > 0) {
        const delta = paddle.shape.yMid - ball.shape.yMid;

        if (Math.abs(delta) > CPU_PADDLE_TOLERANCE) {
          paddle.dir = delta > 0 ? Direction.Up : Direction.Down;
        }
      }
      break;
  }
}

enum GamePlayState {
  StartMatch, // Start of a match, state reset.
  StartRound, // Wait for ball to start moving.
  PlayRound, // Ball moves, game has started.
  EndRound, // A player scored a point.
  EndMatch, // Match has a winner.
}

export class GamePlayScene extends Scene {
  private _state: GamePlayState = GamePlayState.StartMatch;
  private _background!: HTMLCanvasElement;
  private _player1: Paddle = newPaddle(Player.One);
  private _player2: Paddle = newPaddle(Player.Two);
  private _ball: Ball = newBall();

  constructor() {
    super();
    this._background = generateBackgroundTexture();
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

  override deinit(): void {
    Timer.removeAllTimers();
  }

  update(dt: number): void {
    if (this._state === GamePlayState.StartMatch) return;

    let players = [this._player1, this._player2];

    for (let player of players) {
      handleInput(player, this._ball, this._state);
      player.update(dt);
      player.pos.y = clamp(player.pos.y, 0, CANVAS_H - player.size.h);
    }

    // Update ball position only during gameplay.
    if (
      this._state === GamePlayState.PlayRound ||
      this._state === GamePlayState.EndRound
    ) {
      this._ball.update(dt);
    }

    if (this._ball.shape.yMin < 0) {
      this._ball.pos.y = 0;
      this._ball.dir.y = -this._ball.dir.y;
      AudioHelper.playRandomImpactSound(this._ball.speed);
    }

    if (this._ball.shape.yMax > CANVAS_H) {
      this._ball.pos.y = CANVAS_H - this._ball.size.h;
      this._ball.dir.y = -this._ball.dir.y;
      AudioHelper.playRandomImpactSound(this._ball.speed);
    }

    for (let player of players) {
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

    if (this._state === GamePlayState.PlayRound) {
      if (this._ball.shape.xMax < 0) {
        this.endRound(this._player2);
      }

      if (this._ball.shape.xMin > CANVAS_W) {
        this.endRound(this._player1);
      }
    }
  }

  draw(renderer: Renderer): void {
    renderer.drawImage(this._background, 0, 0);

    if (this._state !== GamePlayState.StartMatch) {
      const text = `${this._player1.score} vs ${this._player2.score}`;
      renderer.drawText(text, CANVAS_W / 2, 48, {
        font: "48px Jumpman",
        color: "#ffffff",
        align: "center",
      });
    }

    this._player1.draw(renderer);
    this._player2.draw(renderer);
    this._ball?.draw(renderer);
  }

  start() {
    this._state = GamePlayState.StartMatch;

    this._player1 = newPaddle(Player.One);
    this._player2 = newPaddle(Player.Two);
    this._ball = newBall();

    this.startRound();
  }

  private startRound(delay: number = 1.0) {
    Timer.after(delay, () => {
      AudioHelper.playSound("ready");

      this._state = GamePlayState.StartRound;
      this._ball = newBall();
      Timer.every(
        0.1,
        ROUND_DELAY,
        () => {
          this._ball.isVisible = this._ball.isVisible === false;
        },
        () => {
          this._ball.isVisible = true;
          this._state = GamePlayState.PlayRound;
          AudioHelper.playSound("go");
        }
      );
    });
  }

  private endRound(winner: Paddle) {
    winner.score += 1;

    const hasWinner =
      this._player1.score === MATCH_POINTS ||
      this._player2.score === MATCH_POINTS;

    if (hasWinner) {
      this._state = GamePlayState.EndMatch;

      Timer.after(0.2, () => {
        this._state = GamePlayState.StartMatch;
        endGame(
          this._player1.score > this._player2.score ? Player.One : Player.Two
        );
      });
    } else {
      this._state = GamePlayState.EndRound;
      this.startRound();
    }
  }
}
