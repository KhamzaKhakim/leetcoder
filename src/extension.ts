import * as vscode from "vscode";
import { fetchProblemDetail, fetchProblemList } from "./fetcher";
import { Problem } from "./types";
import { formatCode } from "./formatCode";

export function activate(context: vscode.ExtensionContext) {
  const openProblemCommand = vscode.commands.registerCommand(
    "leetcoder.openProblem",
    async () => {
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const quickPick = vscode.window.createQuickPick<
        vscode.QuickPickItem & { problem: Problem }
      >();

      quickPick.title =
        "Loading problems... (fetching from LeetCode for the first time)";
      quickPick.placeholder = "Hang tight, this won't take long :)";
      quickPick.busy = true;
      quickPick.show();

      const response = await fetchProblemList();
      //TODO: incrementally fetch problems and cache them in memory

      quickPick.items = response.problems.map((p) => ({
        label: `${p.id}. ${p.title}`,
        description: p.difficulty as string,
        problem: p,
      }));
      quickPick.title = undefined;
      quickPick.placeholder = "Search for a LeetCode problem...";
      quickPick.busy = false;

      quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0];
        quickPick.dispose();

        if (!selected) {
          return;
        }

        const { titleSlug } = selected.problem;
        const detail = await fetchProblemDetail(titleSlug);

        const tsSnippet = detail.codeSnippets?.find(
          (c) => c.langSlug === "typescript",
        )?.code;

        if (!tsSnippet) {
          vscode.window.showWarningMessage(
            "No TypeScript snippet found for this problem.",
          );
          return;
        }

        const formattedCode = formatCode(tsSnippet);

        const editor = vscode.window.activeTextEditor;

        if (editor && editor.document.languageId === "typescript") {
          editor.edit((editBuilder) => {
            const isEmpty = editor.document.getText().trim() === "";
            if (isEmpty) {
              editBuilder.insert(new vscode.Position(0, 0), tsSnippet);
            } else {
              const end = editor.document.lineAt(editor.document.lineCount - 1)
                .range.end;
              editBuilder.insert(end, "\n\n" + tsSnippet);
            }
          });
        } else {
          if (!vscode.workspace.workspaceFolders?.length) {
            vscode.window.showErrorMessage("Open a workspace folder first.");
            return;
          }

          const uri = vscode.Uri.joinPath(
            vscode.workspace.workspaceFolders[0].uri,
            `${titleSlug}.ts`,
          );

          const encoder = new TextEncoder();
          await vscode.workspace.fs.writeFile(
            uri,
            encoder.encode(formattedCode),
          );
          await vscode.window.showTextDocument(uri);
        }

        //TODO: Add webview with the task description
      });
    },
  );
  context.subscriptions.push(openProblemCommand);
}

export function deactivate() {}
