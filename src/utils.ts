import * as vscode from "vscode";

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

//TODO: add settings where you can set leetcode tasks path like /src/two-sum.ts
// right now works only with /two-sum.ts
export async function checkFileExists(path: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  const fileUri = vscode.Uri.joinPath(
    workspaceFolders[0].uri,
    // "src",
    path,
  );
  return fileExists(fileUri);
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
