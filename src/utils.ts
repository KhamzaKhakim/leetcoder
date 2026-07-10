import * as vscode from "vscode";
import { Language } from "./types";

export async function fileExistsAtUri(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

export async function fileExistsAtPath(path: string): Promise<boolean> {
  return fileExistsAtUri(vscode.Uri.file(path));
}

export const FILE_EXTENSION_RECORD: Record<Language, string> = {
  python: "py",
  python3: "py",
  javascript: "js",
  typescript: "ts",
  java: "java",
  cpp: "cpp",
  c: "c",
  csharp: "cs",
  go: "go",
  rust: "rs",
  kotlin: "kt",
  swift: "swift",
};

export const LANGUAGE_NAME_RECORD: Record<string, string> = {
  python: "Python",
  python3: "Python 3",
  javascript: "Javascript",
  typescript: "Typescript",
  java: "Java",
  cpp: "C++",
  c: "C",
  csharp: "C#",
  go: "GO",
  rust: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
};

export const COMMENT_PREFIX_BY_EXTENSION_RECORD: Record<Language, string> = {
  python: "#",
  python3: "#",
  javascript: "//",
  typescript: "//",
  java: "//",
  cpp: "//",
  c: "//",
  csharp: "//",
  go: "//",
  rust: "//",
  kotlin: "//",
  swift: "//",
};

export function setCursorLine(editor: vscode.TextEditor, line: number, character = 0) {
  const position = new vscode.Position(line, character);
  editor.selection = new vscode.Selection(position, position);
}
