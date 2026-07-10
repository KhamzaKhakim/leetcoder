import * as vscode from "vscode";
import { webviewRegistry } from "./webviewRegistry";

export class LeetCoderCodeLensProvider implements vscode.CodeLensProvider {
  onDidChangeCodeLenses = webviewRegistry.onDidChange;

  constructor(
    private commandId: string,
    private openDescriptionCommandId: string,
  ) {}

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const key = document.uri.toString();

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      if (line.text.includes("// @leetcode:end")) {
        const range = new vscode.Range(i + 1, 0, i + 1, 0);

        lenses.push(
          new vscode.CodeLens(range, {
            title: "Upload to LeetCode",
            command: this.commandId,
          }),
        );

        const panel = webviewRegistry.get(key);

        if (!panel || !panel.visible) {
          lenses.push(
            new vscode.CodeLens(range, {
              title: panel ? "Focus task description" : "Open task description",
              command: this.openDescriptionCommandId,
              arguments: [document],
            }),
          );
        }
      }
    }
    return lenses;
  }
}
