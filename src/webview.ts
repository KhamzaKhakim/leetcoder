import path from "path";
import { Problem, ProblemDetail, SubmissionCheckResponse } from "./types";
import * as vscode from "vscode";
import { webviewRegistry } from "./webviewRegistry";
import { getCookieAndCsrf, sleep } from "./utils";
import { renderTemplate } from "./webviews/helper";

export function createProblemWebview(
  detail: ProblemDetail,
  context: vscode.ExtensionContext,
  key: string,
) {
  const existing = webviewRegistry.get(key);
  if (existing) {
    existing.reveal(vscode.ViewColumn.Two, true);
    return existing;
  }

  const panel = vscode.window.createWebviewPanel("leetcoder", detail.title, {
    viewColumn: 2,
    preserveFocus: true,
  });
  webviewRegistry.register(key, panel);

  const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, "src", "style.css"));

  panel.webview.html = getProblemHtml(detail, panel, context);

  return panel;
}

function getProblemHtml(
  problem: ProblemDetail,
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
): string {
  const url = `https://leetcode.com/problems/${problem.titleSlug}/`;
  const difficultyClass = problem.difficulty.toLowerCase();
  const topicsHtml = problem.topicTags
    .map((t) => `<span class="topic-tag">${t.name}</span>`)
    .join("");

  //getting content of examples and so on
  let contentHtml = problem.contentHtml;
  let content = "";

  let x = contentHtml.indexOf('<p><strong class="example">Example');
  while (x !== -1 && x) {
    // append everything before this example
    content += contentHtml.substring(0, x);
    contentHtml = contentHtml.slice(x);

    // open the wrapper div
    content += '<div class="example-block">';

    // find end of the example, INCLUDING the closing </pre> tag
    x = contentHtml.indexOf("</pre>") + "</pre>".length;
    content += contentHtml.substring(0, x);

    // close the div AFTER </pre> so nesting is valid
    content += "</div>";
    contentHtml = contentHtml.slice(x);

    // next example
    x = contentHtml.indexOf('<p><strong class="example">Example');
  }

  const cssPath = vscode.Uri.file(path.join(context.extensionPath, "src", "style.css"));

  const templatePath = path.join(context.extensionPath, "src", "webviews", "problem", "index.html");

  return renderTemplate(templatePath, {
    title: problem.title,
    cssUri: panel.webview.asWebviewUri(cssPath).toString(),
    difficulty: problem.difficulty,
    difficultyClass: problem.difficulty.toLowerCase(),
    url: `https://leetcode.com/problems/${problem.titleSlug}/`,
    content,
    topicsHtml,
  });
}

export function createUploadWebview(
  submissionId: number,
  detail: Problem,
  context: vscode.ExtensionContext,
) {
  const key = `submission-${submissionId}`;
  const existing = webviewRegistry.get(key);

  if (existing) {
    existing.reveal(vscode.ViewColumn.Two, true);
    return existing;
  }

  const panel = vscode.window.createWebviewPanel(
    "leetcoder-submission",
    `Submission: ${detail.title}`,
    { viewColumn: 2, preserveFocus: true },
    { enableScripts: true, retainContextWhenHidden: true },
  );
  webviewRegistry.register(key, panel);

  const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, "src", "style.css"));
  const cssUri = panel.webview.asWebviewUri(onDiskPath);

  panel.webview.html = getUploadHtml(detail, panel, context);

  let stopped = false;
  panel.onDidDispose(() => {
    stopped = true;
  });

  pollSubmission(submissionId, panel, context, detail.titleSlug, () => stopped);

  return panel;
}

const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 30;

async function pollSubmission(
  submissionId: number,
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
  titleSlug: string,
  isStopped: () => boolean,
) {
  const url = `https://leetcode.com/submissions/detail/${submissionId}/check/`;

  const { cookie, csrfToken } = await getCookieAndCsrf(context);

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    if (isStopped()) {
      return;
    }

    try {
      const res = await fetch(url, {
        headers: {
          Cookie: cookie,
          "x-csrftoken": csrfToken,
          Referer: `https://leetcode.com/problems/${titleSlug}/`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as SubmissionCheckResponse;

      if (data.state === "PENDING" || data.state === "STARTED") {
        if (isStopped()) {
          return;
        }
        panel.webview.postMessage({ type: "pending", attempt });
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      if (!isStopped()) {
        panel.webview.postMessage({ type: "result", data });
      }
      return;
    } catch (err) {
      if (attempt === MAX_POLL_ATTEMPTS) {
        if (!isStopped()) {
          panel.webview.postMessage({
            type: "error",
            message: err instanceof Error ? err.message : "Failed to fetch submission result.",
          });
        }
        return;
      }
      await sleep(POLL_INTERVAL_MS);
    }
  }

  if (!isStopped()) {
    panel.webview.postMessage({
      type: "error",
      message: "Timed out waiting for a verdict from LeetCode.",
    });
  }
}

function getUploadHtml(
  problem: Problem,
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
): string {
  const cssPath = vscode.Uri.file(path.join(context.extensionPath, "src", "style.css"));
  const jsPath = vscode.Uri.file(
    path.join(context.extensionPath, "src", "webviews", "submission", "index.js"),
  );

  const templatePath = path.join(
    context.extensionPath,
    "src",
    "webviews",
    "submission",
    "index.html",
  );

  return renderTemplate(templatePath, {
    title: problem.title,
    cssUri: panel.webview.asWebviewUri(cssPath).toString(),
    jsUri: panel.webview.asWebviewUri(jsPath).toString(),
    difficultyClass: problem.difficulty.toLowerCase(),
    difficulty: problem.difficulty,
  });
}
