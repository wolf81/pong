import { XmlNode, XmlParser } from "./xml_parser";

export type Sprite = {
  name: string | undefined;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SpriteSheet = {
  image: string;
  sprites: Sprite[];
};

export const Spritesheet = {
  new(xml: XmlNode): SpriteSheet {
    const sprites: Sprite[] = [];

    const imagePath = xml.attributes["imagePath"];
    const quadNodes = XmlParser.findNodes(xml, "SubTexture");
    for (let node of quadNodes) {
      sprites.push({
        name: node.attributes["name"],
        x: Number(node.attributes["x"]),
        y: Number(node.attributes["y"]),
        w: Number(node.attributes["width"]),
        h: Number(node.attributes["height"]),
      });
    }

    return { image: getFileName(imagePath), sprites: sprites };
  },

  firstIndexOf(sheet: SpriteSheet, name: string): number {
    return sheet.sprites.findIndex((s) => s.name === name);
  },
};

// Private

// TODO: We use same function in AssetLoader, maybe put in internal utils.
function getFileName(path: string): string {
  const parts = path.split("/").pop()?.split("\\").pop()?.split(".") || [];
  if (parts.length <= 1) return parts[0] || "";
  parts.pop();
  return parts.join(".");
}
