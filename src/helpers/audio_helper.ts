import { AssetLoader } from "../lib/asset_loader";
import { ServiceLocator } from "../lib/service_locator";

type Impact = "light" | "medium" | "heavy";

export class AudioHelper {
  static playRandomImpactSound(speed: number): void {
    const assetLoader = ServiceLocator.resolve(AssetLoader);

    const impact: Impact =
      speed < 12 ? "heavy" : speed < 16 ? "medium" : "light";
    let sounds: string[] = [];

    switch (impact) {
      case "light":
        sounds = [
          "impactWood_light_000",
          "impactWood_light_001",
          "impactWood_light_002",
          "impactWood_light_003",
          "impactWood_light_004",
        ];
        break;
      case "medium":
        sounds = [
          "impactWood_medium_000",
          "impactWood_medium_001",
          "impactWood_medium_002",
          "impactWood_medium_003",
          "impactWood_medium_004",
        ];
        break;
      case "heavy":
        sounds = [
          "impactWood_heavy_000",
          "impactWood_heavy_001",
          "impactWood_heavy_002",
          "impactWood_heavy_003",
          "impactWood_heavy_004",
        ];
        break;
    }

    // TODO: Use own seedable Random library.
    const idx = Math.floor(Math.random() * sounds.length);
    const sound = sounds[idx];
    const audio = assetLoader.getAudio(sound);
    audio.currentTime = 0; // Rewind if playing.
    audio.play();
  }
}
