export interface XmlNode {
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text?: string;
}

function trimNewlines(str: string): string {
  return str.replace(/^(?:\r\n|\r|\n)+|(?:\r\n|\r|\n)+$/g, "");
}

function convertElement(el: Element): XmlNode {
  const node: XmlNode = {
    name: el.tagName,
    attributes: {},
    children: [],
  };

  for (const attr of el.attributes) {
    node.attributes[attr.name] = attr.value;
  }

  for (const child of el.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      node.children.push(convertElement(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) {
      if (child.textContent) {
        const text = trimNewlines(child.textContent);
        if (text) {
          node.text = text;
        }
      }
    }
  }

  return node;
}

/**
 * A very basic XML parser. Included to avoid adding dependencies, but it might
 * not be the most performant.
 */
export const XmlParser = {
  parse(xmlString: string): XmlNode {
    let xml: Document;

    try {
      const parser = new DOMParser();
      xml = parser.parseFromString(xmlString, "application/xml");
    } catch (err) {
      // xmldom throws immediately on invalid input
      throw new Error(
        "XML Parse Error: " + (err instanceof Error ? err.message : String(err))
      );
    }

    const error = xml.querySelector?.("parsererror");
    if (error) {
      throw new Error("XML Parse Error: " + error.textContent);
    }

    const root = xml.documentElement;
    return convertElement(root);
  },

  findNodes(
    root: XmlNode,
    tagName: string,
    attrs?: Record<string, string>
  ): XmlNode[] {
    const result: XmlNode[] = [];

    function visit(node: XmlNode) {
      if (node.name === tagName) {
        if (!attrs || XmlParser.matchAttributes(node, attrs)) {
          result.push(node);
        }
      }
      for (const child of node.children) {
        visit(child);
      }
    }

    visit(root);
    return result;
  },

  matchAttributes(
    node: XmlNode,
    attrs: Record<string, string>
  ): boolean {
    for (const [key, val] of Object.entries(attrs)) {
      if (node.attributes[key] !== val) {
        return false;
      }
    }
    return true;
  }
}
