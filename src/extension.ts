import * as vscode from "vscode";
import { Problem } from "./types";
import { formatCode } from "./formatCode";
import { getProblemList } from "./storage";
import { fetchProblemDetail } from "./fetcher";
import { FILE_NAME } from "./constants";
import { existsSync } from "fs";
import { checkFileExists } from "./utils";
import { handleUriSignIn, login } from "./login";
import { createProblemWebview } from "./createProblemWebview";

let STATE = { isFetching: false };

export function activate(context: vscode.ExtensionContext) {
  const openProblemCommand = vscode.commands.registerCommand("leetcoder.openProblem", async () => {
    if (STATE.isFetching) {
      vscode.window.showWarningMessage(
        "Fetching all LeetCode problems. Please wait several seconds",
      );
      return;
    }
    const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem & { problem: Problem }>();

    quickPick.title = "Loading problems... (fetching from LeetCode for the first time)";
    quickPick.placeholder = "Hang tight, this won't take long :)";
    quickPick.busy = true;
    quickPick.show();

    const isCached = existsSync(vscode.Uri.joinPath(context.globalStorageUri, FILE_NAME).path);

    if (!vscode.workspace.workspaceFolders?.length) {
      vscode.window.showErrorMessage("Open a workspace folder first.");
      return;
    }

    if (!isCached) {
      quickPick.title = "Loading problems... (fetching from LeetCode for the first time)";
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

      const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, `${titleSlug}.ts`);

      const tsSnippet = detail.codeSnippets?.find((c) => c.langSlug === "typescript")?.code;

      if (!tsSnippet) {
        vscode.window.showWarningMessage("No TypeScript snippet found for this problem.");
        return;
      }

      const formattedCode = formatCode(tsSnippet);

      if (await checkFileExists(`${titleSlug}.ts`)) {
        await vscode.window.showTextDocument(uri);
        const editor = vscode.window.activeTextEditor!;
        const isEmpty = editor.document.getText().trim() === "";

        if (!isEmpty) {
          const answer = await vscode.window.showWarningMessage(
            `${titleSlug}.ts already has code. Reset it?`,
            "Reset",
            "Cancel",
          );
          if (answer === "Cancel") {
            return;
          }
        }

        editor.edit((editBuilder) => {
          if (isEmpty) {
            editBuilder.insert(new vscode.Position(0, 0), tsSnippet);
          } else {
            const fullRange = new vscode.Range(
              new vscode.Position(0, 0),
              editor.document.lineAt(editor.document.lineCount - 1).range.end,
            );
            editBuilder.replace(fullRange, formattedCode);
          }
        });
      } else {
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(uri, encoder.encode(formattedCode));
        await vscode.window.showTextDocument(uri);
      }
      createProblemWebview(detail, context);
    });
  });

  const loginCommand = vscode.commands.registerCommand("leetcoder.login", () => {
    login();
  });

  //Test
  const getCookie = vscode.commands.registerCommand("leetcoder.getCookie", async () => {
    const cookie = await context.secrets.get("leetcode.cookie");
    console.log("cookie: " + cookie);
  });

  context.subscriptions.push(openProblemCommand, loginCommand, getCookie);
  vscode.window.registerUriHandler({ handleUri: (uri) => handleUriSignIn(uri, context) });
}

export function deactivate() {}
