import * as vscode from "vscode";
import { Problem } from "./types";
import { formatCode } from "./formatCode";
import { getProblemList, getProblemListUpload } from "./storage";
import { fetchProblemDetail } from "./fetcher";
import { FILE_NAME } from "./constants";
import { existsSync } from "fs";
import { FILE_EXTENSION_RECORD, fileExistsAtUri } from "./utils";
import { handleUriSignIn, login } from "./login";
import { createProblemWebview } from "./createProblemWebview";
import { getUploadCode, upload } from "./upload";
import * as path from "path";

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

      const config = vscode.workspace.getConfiguration("leetcoder");

      const language = config.get<string>("language");
      const path = config.get<string>("path");

      if (!language) {
        throw new Error("Language config is empty");
      }

      if (!path) {
        throw new Error("Path config is empty");
      }

      const uri = vscode.Uri.joinPath(
        vscode.workspace.workspaceFolders![0].uri,
        path,
        `${titleSlug}.${FILE_EXTENSION_RECORD[language]}`,
      );

      const snippet = detail.codeSnippets?.find((c) => c.langSlug === language)?.code;

      if (!snippet) {
        vscode.window.showWarningMessage("No TypeScript snippet found for this problem.");
        return;
      }

      const formattedCode = formatCode(snippet);

      if (await fileExistsAtUri(uri)) {
        await vscode.window.showTextDocument(uri, {
          viewColumn: 1,
        });
        const editor = vscode.window.activeTextEditor!;
        const isEmpty = editor.document.getText().trim() === "";

        if (!isEmpty) {
          const answer = await vscode.window.showWarningMessage(
            `${titleSlug}.${FILE_EXTENSION_RECORD[language]} already has code. Reset it?`,
            "Reset",
            "Cancel",
          );
          if (answer === "Cancel") {
            return;
          }
        }

        editor.edit((editBuilder) => {
          if (isEmpty) {
            editBuilder.insert(new vscode.Position(0, 0), formattedCode);
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
        await vscode.window.showTextDocument(uri, {
          viewColumn: 1,
        });
      }
      createProblemWebview(detail, context);
    });
  });

  const loginCommand = vscode.commands.registerCommand("leetcoder.login", () => {
    login();
  });

  const uploadCommand = vscode.commands.registerCommand("leetcoder.upload", async () => {
    const response = await getProblemListUpload(context);

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active file open.");
      return;
    }

    const filePath = editor.document.fileName;
    const fileNameNoExt = path.parse(filePath).name;

    const problem = response.find((p) => p.titleSlug === fileNameNoExt);

    if (!problem) {
      vscode.window.showErrorMessage("Could not match this file to a LeetCode problem.");
      return;
    }

    const code = getUploadCode(editor.document.getText());

    const res = await upload({
      titleSlug: problem.titleSlug,
      id: problem.id,
      code,
      context,
    });

    vscode.window.showInformationMessage("Submitted the code");
  });

  const setLanguageCommand = vscode.commands.registerCommand("leetcoder.setLanguage", async () => {
    const config = vscode.workspace.getConfiguration("leetcoder");
    const current = config.get<string>("language");

    const languages = [
      { label: "Python 3", value: "python" },
      { label: "JavaScript", value: "javascript" },
      { label: "TypeScript", value: "typescript" },
      { label: "Java", value: "java" },
      { label: "C++", value: "cpp" },
      { label: "C", value: "c" },
      { label: "C#", value: "csharp" },
      { label: "Go", value: "go" },
      { label: "Rust", value: "rust" },
      { label: "Kotlin", value: "kotlin" },
      { label: "Swift", value: "swift" },
    ];

    const items = languages.map((l) => ({
      label: l.value === current ? `$(check) ${l.label}` : l.label,
      value: l.value,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: `Current: ${current} — select a new language`,
    });

    if (picked) {
      await config.update("language", picked.value, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`LeetCoder language set to ${picked.label}`);
    }
  });

  const setPathCommand = vscode.commands.registerCommand("leetcoder.setPath", async () => {
    const config = vscode.workspace.getConfiguration("leetcoder");
    const current = config.get<string>("path", "");

    const input = await vscode.window.showInputBox({
      prompt: "Folder to save LeetCode solutions (relative to workspace root, e.g. src)",
      placeHolder: "Leave empty to use workspace root",
      value: current,
    });

    // undefined means user pressed Escape — don't overwrite in that case
    if (input === undefined) {
      return;
    }

    await config.update("path", input, vscode.ConfigurationTarget.Global);

    vscode.window.showInformationMessage(
      input ? `LeetCoder path set to "${input}"` : "LeetCoder path set to workspace root",
    );
  });

  // const getCookieCommand = vscode.commands.registerCommand("leetcoder.getCookie", async () => {
  //   const cookie = await context.secrets.get("leetcode.cookie");
  //   console.log("cookie: " + cookie);
  //   console.log("csfr: " + cookie?.split(";")[1]);
  // });

  context.subscriptions.push(
    openProblemCommand,
    loginCommand,
    // getCookieCommand,
    uploadCommand,
    setLanguageCommand,
    setPathCommand,
  );
  vscode.window.registerUriHandler({ handleUri: (uri) => handleUriSignIn(uri, context) });
}

export function deactivate() {}
