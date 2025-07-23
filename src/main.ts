import { Game } from "./game";
import { Settings } from "./settings";
import { CANVAS_H, CANVAS_W } from "./constants";
import { Renderer, Runloop } from "./lib/ignite";

const canvas = document.getElementById("game") as HTMLCanvasElement;
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
document.body.appendChild(canvas);

const game = new Game(canvas);
await game.init(); // Preload assets.

const ctx = canvas.getContext("2d")!;
const renderer = new Renderer(ctx);

/**
 * Execute a single game loop.
 * @param time The current time.
 */
function gameLoop(time: number) {
  renderer.startFrame();

  // Ensure the update method runs at a fixed time-step, regardless of fps
  // drops.
  Runloop.update(time, (dt) => game.update(dt));

  // Render based on best-effort (hopefully same as update loop, but not
  // required).
  game.draw(renderer);

  // Draw render stats, if needed (press 'F1' to toggle on/off).
  {
    ctx.fillStyle = "white";
    ctx.font = "16px monospace";
    let y = 20;
    if (Settings.showFps) {
      ctx.fillText(`FPS: ${Runloop.fps}`, 10, y);
      y += 20;
    }

    if (Settings.showDraws) {
      ctx.fillText(`Draws: ${renderer.drawCount}`, 10, y);
    }
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
