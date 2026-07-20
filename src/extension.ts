import * as vscode from "vscode";
import { Language, Problem } from "./types";
import { formatCode } from "./formatCode";
import { getProblem, getProblemList } from "./storage";
import { fetchProblemDetail } from "./fetcher";
import { FILE_NAME } from "./constants";
import { existsSync } from "fs";
import {
  FILE_EXTENSION_RECORD,
  fileExistsAtUri,
  getConfig,
  LANGUAGE_NAME_RECORD,
  setCursorLine,
} from "./utils";
import { handleUriSignIn, login } from "./login";
import { getUploadCode, upload } from "./upload";
import * as path from "path";
import { LeetCoderCodeLensProvider } from "./codelens";
import { createProblemWebview, createUploadWebview } from "./webview";
import { webviewRegistry } from "./webviewRegistry";

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

      const { language, path } = getConfig();

      const uri = vscode.Uri.joinPath(
        vscode.workspace.workspaceFolders![0].uri,
        path,
        `${titleSlug}.${FILE_EXTENSION_RECORD[language]}`,
      );

      const snippet = detail.codeSnippets?.find((c) => c.langSlug === language)?.code;

      if (!snippet) {
        vscode.window.showWarningMessage(
          `No ${LANGUAGE_NAME_RECORD[language]} snippet found for this problem.`,
        );
        return;
      }

      const formattedObj = formatCode(snippet, language);
      let editor: vscode.TextEditor;

      if (await fileExistsAtUri(uri)) {
        editor = await vscode.window.showTextDocument(uri, { viewColumn: 1 });

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

        await editor.edit((editBuilder) => {
          const fullRange = new vscode.Range(
            new vscode.Position(0, 0),
            editor.document.lineAt(editor.document.lineCount - 1).range.end,
          );
          editBuilder.replace(fullRange, formattedObj.code);
        });
      } else {
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(uri, encoder.encode(formattedObj.code));
        editor = await vscode.window.showTextDocument(uri, { viewColumn: 1 });
      }

      //TODO: fix cursor later, low priority for now
      // await setCursorLine(editor, 2);
      createProblemWebview(detail, context, uri.toString());
    });
  });

  const loginCommand = vscode.commands.registerCommand("leetcoder.login", () => {
    login();
  });

  //TODO: add run command to text examples.

  const uploadCommandId = "leetcoder.upload";

  const uploadCommand = vscode.commands.registerCommand(uploadCommandId, async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage("No active file open.");
      return;
    }

    const filePath = editor.document.fileName;
    const fileNameNoExt = path.parse(filePath).name;

    let problem: Problem;

    try {
      problem = await getProblem(fileNameNoExt, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(message);
      return;
    }

    const code = getUploadCode(editor.document.getText());

    const res = await upload({
      titleSlug: problem.titleSlug,
      id: problem.id,
      code,
      context,
    });

    createUploadWebview(res.submission_id, problem, context);
    //TODO: if it is accepted show the tick for fileName.
    //TODO: if there is an error in some case make a button to put the case in the code as in examples.
    // Probably should skip it if it is because inefficient code and case is too big.

    vscode.window.showInformationMessage("Submitted the code");
  });

  const setLanguageCommand = vscode.commands.registerCommand("leetcoder.setLanguage", async () => {
    const config = vscode.workspace.getConfiguration("leetcoder");
    const current = config.get<string>("language");

    const languages: { label: string; value: Language }[] = [
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

  const openDescriptionCommand = vscode.commands.registerCommand(
    "leetcoder.openDescription",
    async () => {
      const uri = vscode.window.activeTextEditor?.document.uri;

      if (!uri) {
        vscode.window.showErrorMessage("File is not opened.");
        return;
      }

      const fileName = path.parse(uri.fsPath).name;

      const existing = webviewRegistry.get(uri.toString());
      if (existing) {
        existing.reveal(vscode.ViewColumn.Two, true);
        return existing;
      }

      const detail = await fetchProblemDetail(fileName);

      createProblemWebview(detail, context, uri.toString());
    },
  );

  const codelensProvider = vscode.languages.registerCodeLensProvider(
    { scheme: "file" },
    new LeetCoderCodeLensProvider(uploadCommandId, "leetcoder.openDescription"),
  );

  context.subscriptions.push(
    openProblemCommand,
    loginCommand,
    uploadCommand,
    codelensProvider,
    setLanguageCommand,
    setPathCommand,
    openDescriptionCommand,
  );

  vscode.window.registerUriHandler({ handleUri: (uri) => handleUriSignIn(uri, context) });
}

export function deactivate() {}
