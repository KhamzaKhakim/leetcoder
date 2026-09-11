import { Language } from "./types";

// Language tables kept free of any "vscode" import so they can be unit-tested in plain Node.
// Only TypeScript and JavaScript are enabled for now; see LANGUAGES in constants.ts.

export const FILE_EXTENSION_RECORD: Record<Language, string> = {
  // python: "py",
  // python3: "py",
  javascript: "js",
  typescript: "ts",
  // java: "java",
  // cpp: "cpp",
  // c: "c",
  // csharp: "cs",
  // go: "go",
  // rust: "rs",
  // kotlin: "kt",
  // swift: "swift",
};

export const LANGUAGE_NAME_RECORD: Record<Language, string> = {
  // python: "Python",
  // python3: "Python 3",
  javascript: "JavaScript",
  typescript: "TypeScript",
  // java: "Java",
  // cpp: "C++",
  // c: "C",
  // csharp: "C#",
  // go: "GO",
  // rust: "Rust",
  // kotlin: "Kotlin",
  // swift: "Swift",
};

export const COMMENT_PREFIX_BY_EXTENSION_RECORD: Record<Language, string> = {
  // python: "#",
  // python3: "#",
  javascript: "//",
  typescript: "//",
  // java: "//",
  // cpp: "//",
  // c: "//",
  // csharp: "//",
  // go: "//",
  // rust: "//",
  // kotlin: "//",
  // swift: "//",
};
