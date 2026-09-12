import * as vscode from "vscode";
import { webviewRegistry } from "./webviewRegistry";

export class LeetCoderCodeLensProvider implements vscode.CodeLensProvider {
  onDidChangeCodeLenses = webviewRegistry.onDidChange;

  constructor(
    private commandId: string,
    private openDescriptionCommandId: string,
  ) {}

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const markerLine = this.findLeetcodeEndLine(document);
    if (markerLine === -1) {
      return [];
    }

    const range = new vscode.Range(markerLine + 1, 0, markerLine + 1, 0);
    const panel = webviewRegistry.get(document.uri.toString());

    const lenses: vscode.CodeLens[] = [
      new vscode.CodeLens(range, {
        title: "Upload to LeetCode",
        command: this.commandId,
      }),
    ];

    if (!panel || !panel.visible) {
      lenses.push(
        new vscode.CodeLens(range, {
          title: panel ? "Focus task description" : "Open task description",
          command: this.openDescriptionCommandId,
          arguments: [document],
        }),
      );
    }

    return lenses;
  }

  private findLeetcodeEndLine(document: vscode.TextDocument): number {
    for (let i = 0; i < document.lineCount; i++) {
      if (document.lineAt(i).text.includes("// @leetcode:end")) {
        return i;
      }
    }
    return -1;
  }
}
