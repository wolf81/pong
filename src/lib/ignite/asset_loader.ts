import { SpriteSheet, Spritesheet } from "./spritesheet";
import { XmlNode, XmlParser } from "./xml_parser";

function getFileName(path: string): string {
  const parts = path.split("/").pop()?.split("\\").pop()?.split(".") || [];
  if (parts.length <= 1) return parts[0] || "";
  parts.pop();
  return parts.join(".");
}

const IMAGE_EXTENSIONS = [".png", ".jpg"];
const AUDIO_EXTENSIONS = [".wav", ".mp3", ".ogg"];
const FONT_EXTENSIONS = [".ttf"];

/**
 * Use the asset loader to load assets using a manifest.json file. The manifest
 * file should by located in /public/assets/ and contain a list of asset file
 * paths.
 *
 * It's possible to generate a manifest.json file by executing the
 * /scripts/generate-manifest.js script.
 */
export class AssetLoader {
  private _imageRegistry = new Map<string, HTMLImageElement>();
  private _audioRegistry = new Map<string, HTMLAudioElement>();
  private _xmlRegistry = new Map<string, XmlNode>();
  private _jsonRegistry = new Map<string, any>();
  private _spriteSheetRegistry = new Map<string, SpriteSheet>();

  /**
   * Get an image asset by name.
   * @param name The filename without extension.
   * @returns
   */
  getImage(name: string): HTMLImageElement {
    return this._imageRegistry.get(name)!;
  }

  /**
   * Get an audio asset by name.
   * @param name The filename without extension.
   * @returns
   */
  getAudio(name: string): HTMLAudioElement {
    return this._audioRegistry.get(name)!;
  }

  /**
   * Get a XML document by name.
   * @param name The filename without extension.
   * @returns
   */
  getXml(name: string): XmlNode {
    return this._xmlRegistry.get(name)!;
  }

  /**
   * Get a JSON document by name.
   * @param name The filename without extension.
   * @returns
   */
  getJson<T>(name: string): T {
    return this._jsonRegistry.get(name) as T;
  }

  /**
   * Returns a spritesheet
   * @param name The name of the spritesheet.
   * @param index
   * @returns
   */
  getSpriteSheet(name: string): SpriteSheet {
    return this._spriteSheetRegistry.get(name)!;
  }

  /**
   * Preload the assets from the manifest.json file.
   *
   * PLEASE NOTE: Only supported the following asset types are loaded:
   * - image types: png & jpg
   * - audio types: wav, mp3 & ogg
   * - font types: ttf
   *
   * With regards to fonts, once the font is loaded it is globally available.
   * In order to use the font, just use the name (without extension) as such:
   *
   * ```
   * ctx.font = "12px MyFontName"; // filename: MyFontName.ttf
   * ctx.fillText("Hello World!", 0, 0);
   * ```
   */
  async preload(): Promise<void> {
    try {
      const response = await fetch("assets/manifest.json");
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.statusText}`);
      }
      const manifest = await response.json();
      console.log("Manifest loaded:", manifest);

      // Now you can use the manifest to load assets
      for (const filePath of manifest.assets) {
        const url = `assets/${filePath}`;
        console.log(`Loading asset: ${url}`);

        if (IMAGE_EXTENSIONS.some((ext) => url.endsWith(ext))) {
          const image = new Image();
          image.src = url;
          await image.decode();
          this._imageRegistry.set(getFileName(filePath), image);
          continue;
        }

        if (AUDIO_EXTENSIONS.some((ext) => url.endsWith(ext))) {
          const audio = new Audio(url);
          audio.load();
          this._audioRegistry.set(getFileName(filePath), audio);
          continue;
        }

        if (FONT_EXTENSIONS.some((ext) => url.endsWith(ext))) {
          const fontName = getFileName(filePath);
          const font = new FontFace(fontName, `url(${url})`);
          await font.load();
          document.fonts.add(font);
          continue;
        }

        if (url.endsWith(".json")) {
          const data = await fetch(url);
          const json = await data.json();
          this._jsonRegistry.set(getFileName(filePath), json);
          continue;
        }

        if (url.endsWith(".xml")) {
          const data = await fetch(url);
          const xmlString = await data.text();
          const xml = XmlParser.parse(xmlString);
          this._xmlRegistry.set(getFileName(filePath), xml);
          continue;
        }
      }
    } catch (error) {
      console.error("Error loading manifest:", error);
    }
  }

  /**
   * Load a sprite sheet from a pre-loaded XML file.
   * @param xmlName
   */
  loadSpriteSheet(xmlName: string) {
    const xml = this.getXml(xmlName);
    const spriteSheet = Spritesheet.new(xml);
    this._spriteSheetRegistry.set(spriteSheet.image, spriteSheet);
  }
}
