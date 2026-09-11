import * as vscode from "vscode";
import { Language } from "./types";
import { LANGUAGES } from "./constants";
import { extractCsrfToken } from "./cookie";

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

export async function setCursorLine(editor: vscode.TextEditor, line: number) {
  const { insertSpaces, tabSize } = editor.options;
  const indent = insertSpaces ? " ".repeat(Number(tabSize)) : "\t";

  await editor.edit((editBuilder) => {
    editBuilder.insert(new vscode.Position(line, 0), indent);
  });

  const position = new vscode.Position(line, indent.length);
  editor.selection = new vscode.Selection(position, position);
  editor.revealRange(new vscode.Range(position, position));
}

export async function getCookieAndCsrf(context: vscode.ExtensionContext) {
  const cookie = await context.secrets.get("leetcode.cookie");
  if (!cookie) {
    throw new Error("Cookie not found");
  }

  return { cookie, csrfToken: extractCsrfToken(cookie) };
}

//TODO: add new config to set task description side. For now it is right, whereas in leetcode it is on the left. I want to make it selectable
export function getConfig() {
  const config = vscode.workspace.getConfiguration("leetcoder");

  const language = config.get<string>("language");

  if (!language) {
    throw new Error("Language config is empty");
  }

  if (!(LANGUAGES as readonly string[]).includes(language)) {
    throw new Error(
      `Language "${language}" is not supported yet. Supported: ${LANGUAGES.join(", ")}`,
    );
  }

  const path = config.get<string>("path");

  if (path === undefined) {
    throw new Error("Path config is empty");
  }

  return { language: language as Language, path };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
