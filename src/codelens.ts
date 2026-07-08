import * as vscode from "vscode";

export class UploadCodeLensProvider implements vscode.CodeLensProvider {
  constructor(private commandId: string) {}

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      if (line.text.includes("// @leetcode:end")) {
        const range = new vscode.Range(i + 1, 0, i + 1, 0);
        lenses.push(
          new vscode.CodeLens(range, {
            title: "▶ Upload",
            command: this.commandId,
          }),
        );
      }
    }
    return lenses;
  }
}
