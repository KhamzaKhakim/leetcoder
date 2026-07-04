export function formatCode(snippet: string) {
  let formattedCode = "";
  if (hasDefinition(snippet)) {
    const def = extractDefinitions(snippet);
    const code = stripDefinitions(snippet);
    formattedCode = def + "\n\n// @leetcode:start\n" + code + "\n// @leetcode:end";
  } else {
    formattedCode = snippet;
  }

  return formattedCode;
}

const DEFINITION_BLOCK_RE = /\/\*\*\s*\n\s*\*\s*Definition for[\s\S]*?\*\/\n?/g;

function hasDefinition(snippet: string): boolean {
  return /\/\*\*\s*\n\s*\* Definition for/.test(snippet);
}

function stripDefinitions(snippet: string): string {
  return snippet.replace(DEFINITION_BLOCK_RE, "").trim();
}

function extractDefinitions(snippet: string): string {
  const matches = snippet.matchAll(DEFINITION_BLOCK_RE);

  return Array.from(matches)
    .map((match) => {
      const inner = match[0]
        .replace(/^\/\*\*\s*\n/, "") // strip opening /**
        .replace(/\s*\*\/\s*$/, ""); // strip closing */

      return inner
        .split("\n")
        .map((line, idx) =>
          idx === 0 ? "// " + line.replace(/^\s*\* ?/, "") : line.replace(/^\s*\* ?/, ""),
        )
        .join("\n")
        .trim();
    })
    .join("\n\n");
}
