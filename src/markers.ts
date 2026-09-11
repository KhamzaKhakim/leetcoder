// Marker handling kept free of any "vscode" import so it can be unit-tested in plain Node.

const START_MARKER = /\/\/\s*@leetcode:start/;
const END_MARKER = /\/\/\s*@leetcode:end/;

/** Return the code between the @leetcode:start and @leetcode:end markers, or "" if not found. */
export function getUploadCode(code: string) {
  const lines = code.split("\n");
  const startIdx = lines.findIndex((line) => START_MARKER.test(line));
  const endIdx = lines.findIndex((line) => END_MARKER.test(line));

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return "";
  }

  return lines
    .slice(startIdx + 1, endIdx)
    .join("\n")
    .trim();
}
