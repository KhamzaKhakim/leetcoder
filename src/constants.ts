export const FILE_NAME = "leetcoder-problem-cache.json";

// Only TypeScript and JavaScript are supported for now.
// Re-enable other languages here (and in package.json, utils.ts, formatCode.ts,
// extension.ts) when their marker/snippet handling is ready.
export const LANGUAGES = [
  "typescript",
  "javascript",
  // "python",
  // "python3",
  // "java",
  // "cpp",
  // "c",
  // "csharp",
  // "go",
  // "rust",
  // "kotlin",
  // "swift",
] as const;

export type Language = (typeof LANGUAGES)[number];
