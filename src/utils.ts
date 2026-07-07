import * as vscode from "vscode";

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

export const FILE_EXTENSION_RECORD: Record<string, string> = {
  python: "py",
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
