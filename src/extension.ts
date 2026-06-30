import * as vscode from "vscode";
import { Problem } from "./types";
import { formatCode } from "./formatCode";
import { getProblemList } from "./storage";
import { fetchProblemDetail } from "./fetcher";
import { FILE_NAME } from "./constants";
import { existsSync } from "fs";

let STATE = { isFetching: false };

export function activate(context: vscode.ExtensionContext) {
  const openProblemCommand = vscode.commands.registerCommand(
    "leetcoder.openProblem",
    async () => {
      if (STATE.isFetching) {
        vscode.window.showWarningMessage(
          "Fetching all LeetCode problems. Please wait several seconds",
        );
        return;
      }
      const quickPick = vscode.window.createQuickPick<
        vscode.QuickPickItem & { problem: Problem }
      >();

      quickPick.busy = true;
      quickPick.show();

      const isCached = existsSync(
        vscode.Uri.joinPath(context.globalStorageUri, FILE_NAME).path,
      );

      if (!isCached) {
        quickPick.title =
          "Loading problems... (fetching from LeetCode for the first time)";
        quickPick.placeholder = "Hang tight, this won't take long :)";
      }

      const toQuickPickItem = (problem: Problem) => ({
        label: `${problem.frontendId}. ${problem.title}`,
        description: problem.difficulty,
        problem,
      });

      const onBatch = (problems: Problem[]) => {
        quickPick.items = problems.map(toQuickPickItem);
      };

      const response = await getProblemList(context, onBatch, STATE);

      quickPick.items = response.map(toQuickPickItem);
      quickPick.busy = false;
      quickPick.title = undefined;
      quickPick.placeholder = "Search for a LeetCode problem...";

      //TODO: can't select while pushing
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
