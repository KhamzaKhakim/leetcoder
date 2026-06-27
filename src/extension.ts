import * as vscode from "vscode";
import { fetchProblemDetail, fetchProblemList } from "./fetcher";
import { Problem } from "./types";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "leetcoder.fetchTwoSum",
    async () => {
      const response = await fetchProblemDetail("two-sum");
      vscode.window.showInformationMessage(response.id + ". " + response.title);
    },
  );

  const openProblemCommand = vscode.commands.registerCommand(
    "leetcoder.openProblem",
    async () => {
      const response = await fetchProblemList();

      const items: (vscode.QuickPickItem & { problem: Problem })[] =
        response.problems.map((p) => ({
          label: `${p.id}. ${p.title}`,
          description: p.difficulty as string,
          problem: p,
        }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Search for a LeetCode problem...",
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (selected) {
        const { titleSlug } = selected.problem;

        const response = await fetchProblemDetail(titleSlug);

        const tsSnippet = response.codeSnippets?.find(
          (c) => c.langSlug === "typescript",
        )?.code;

        if (!tsSnippet) {
          vscode.window.showWarningMessage(
            "No TypeScript snippet found for this problem.",
          );
          return;
        }

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
          await vscode.workspace.fs.writeFile(uri, encoder.encode(tsSnippet));

          const doc = await vscode.workspace.openTextDocument(uri);
          await vscode.window.showTextDocument(doc);
        }
      }
    },
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(openProblemCommand);
}

export function deactivate() {}
