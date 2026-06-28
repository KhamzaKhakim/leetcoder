export function formatCode(snippet: string) {
  let formattedCode = "";
  if (hasDefinition(snippet)) {
    const def = extractDefinitions(snippet);
    const code = stripDefinitions(snippet);
    formattedCode = def + "\n\n" + code;
  } else {
    formattedCode = snippet;
  }

  return formattedCode;
}

function hasDefinition(snippet: string): boolean {
  return /\/\*\*\s*\n\s*\* Definition for/.test(snippet);
}

function stripDefinitions(snippet: string): string {
  return snippet.replace(/\/\*\*\s*\n(?:\s*\*[^\n]*\n)*\s*\*\/\n?/g, "").trim();
}

function extractDefinitions(snippet: string): string {
  const matches = snippet.matchAll(/\/\*\*\s*\n(?:\s*\*[^\n]*\n)*\s*\*\//g);

  return Array.from(matches)
    .map((match) =>
      match[0]
        .split("\n")
        .slice(1, -1) // remove /** and */
        .map((line, idx) =>
          idx === 0
            ? "// " + line.replace(/^\s*\* ?/, "")
            : line.replace(/^\s*\* ?/, ""),
        ) // remove leading " * "
        .join("\n")
        .trim(),
    )
    .join("\n\n");
}

function addTest() {}
