import { Language } from "./types";
import { COMMENT_PREFIX_BY_EXTENSION_RECORD } from "./utils";

export function formatCode(
  snippet: string,
  language: Language,
): {
  code: string;
  cursor: number;
} {
  const comment = COMMENT_PREFIX_BY_EXTENSION_RECORD[language];
  const startMarker = `${comment} @leetcode:start`;
  const endMarker = `${comment} @leetcode:end`;

  let prefix: string;
  let code: string;

  if (hasDefinition(snippet)) {
    const [def, defCode] = extractDefinitionsAndCode(snippet, language);
    prefix = `${def}\n\n${startMarker}\n`;
    code = defCode;
  } else {
    prefix = `${startMarker}\n`;
    code = snippet;
  }

  const formattedCode = `${prefix}${code}\n${endMarker}\n`;
  const cursor = prefix.split("\n").length - 1;

  return { code: formattedCode, cursor };
}

const DEFINITION_BLOCK_RE = /\/\*\*\s*\n\s*\*\s*Definition for[\s\S]*?\*\/\n?/g;

function hasDefinition(snippet: string): boolean {
  return /Definition for/.test(snippet);
}

function extractDefinitionsAndCode(snippet: string, language: Language): [string, string] {
  if (language === "python" || language === "python3") {
    return extractLineCommentDefinitions(snippet, "#");
  } else if (language === "rust") {
    return extractLineCommentDefinitions(snippet, "//");
  }

  const matches = snippet.matchAll(DEFINITION_BLOCK_RE);
  return [
    Array.from(matches)
      .map((match) => {
        const inner = match[0].replace(/^\/\*\*\s*\n/, "").replace(/\s*\*\/\s*$/, "");

        return inner
          .split("\n")
          .map((line, idx) =>
            idx === 0 ? "// " + line.replace(/^\s*\* ?/, "") : line.replace(/^\s*\* ?/, ""),
          )
          .join("\n")
          .trim();
      })
      .join("\n\n"),
    snippet.replace(/\/\*\*\s*\n\s*\*\s*Definition for[\s\S]*?\*\/\n?/g, "").trim(),
  ];
}

function extractLineCommentDefinitions(snippet: string, marker: string): [string, string] {
  const lines = snippet.split("\n");
  const defs: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Definition for")) {
      defs.push(lines[i]);
      lines[i] = "";
      i++;

      while (
        i < lines.length &&
        lines[i].startsWith(marker) &&
        !lines[i].includes("Definition for")
      ) {
        defs.push(lines[i].slice(marker.length).replace(/^\s/, ""));
        lines[i] = "";
        i++;
      }

      i--;
    }
  }

  return [defs.join("\n"), lines.filter(Boolean).join("\n")];
}
