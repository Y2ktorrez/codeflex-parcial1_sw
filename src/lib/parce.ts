import { parseStringPromise } from "xml2js";
import { stripPrefix } from "xml2js/lib/processors";

export interface ParsedAttribute {
  $: {
    name: string;
    type?: string;
  };
}

export interface ParsedClassNode extends Record<string, unknown> {
  $: {
    name: string;
  };
  Attribute?: ParsedAttribute[] | ParsedAttribute;
  attribute?: ParsedAttribute[] | ParsedAttribute;
}

export interface ParsedClass {
  name: string;
  attribute: { name: string; type: string }[];
}

type XmlNode = Record<string, unknown>;

function deepFindNodes<T>(node: XmlNode, targetKey: string): T[] {
  const results: T[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (key === targetKey) {
      results.push(...(Array.isArray(value) ? value : [value]));
    } else if (typeof value === "object") {
      results.push(...deepFindNodes<T>(value as XmlNode, targetKey));
    }
  }

  return results;
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .trim();
}

export async function ParseModelXml(xml: string): Promise<ParsedClass[]> {
  const parsed = await parseStringPromise(xml, {
    tagNameProcessors: [stripPrefix],
    attrNameProcessors: [stripPrefix],
    explicitArray: false,
    mergeAttrs: false,
  });

  const classes = deepFindNodes<ParsedClassNode>(parsed, "Class");
  return classes
    .filter((cls) => {
      const name = normalizeName(cls.$?.name ?? "");
      return name && name !== "EARootClass" && name !== "UnnamedClass";
    })
    .map((cls) => {
      const rawAttrs = [
        ...deepFindNodes<ParsedAttribute>(cls, "Attribute"),
        ...deepFindNodes<ParsedAttribute>(cls, "attribute"),
      ];

      const attributes = rawAttrs
        .filter((attr) => attr.$?.name)
        .map((attr) => ({
          name: normalizeName(attr.$.name),
          type: attr.$.type ?? "text",
        }));

      return {
        name: normalizeName(cls.$?.name ?? ""),
        attribute: attributes,
      };
    });
}
