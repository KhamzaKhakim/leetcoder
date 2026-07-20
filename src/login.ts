import * as vscode from "vscode";

export function login() {
  vscode.commands.executeCommand(
    "vscode.open",
    vscode.Uri.parse(`https://leetcode.com/authorize-login/vscode/?path=khamzakhakim.leetcoder`),
  );
}

//TODO: fix when cookie gets outdated
export async function handleUriSignIn(
  uri: vscode.Uri,
  context: vscode.ExtensionContext,
): Promise<void> {
  try {
    const rawQuery = uri.query.startsWith("&") ? uri.query.slice(1) : uri.query; //query starts with &cookie...
    const params = new URLSearchParams(rawQuery);
    const cookie = params.get("cookie");

    if (!cookie) {
      vscode.window.showErrorMessage("LeetCode sign-in failed: no cookie received.");
      return;
    }

    await context.secrets.store("leetcode.cookie", cookie);
    vscode.window.showInformationMessage("Signed in to LeetCode.");
  } catch (error) {
    vscode.window.showErrorMessage(`LeetCode sign-in failed: ${error}`);
  }
}
