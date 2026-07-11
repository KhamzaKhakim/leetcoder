import path from "path";
import { ProblemDetail } from "./types";
import * as vscode from "vscode";
import { webviewRegistry } from "./webviewRegistry";

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
  const cssUri = panel.webview.asWebviewUri(onDiskPath);

  const difficultyClass = detail.difficulty.toLowerCase();
  const topicsHtml = detail.topicTags
    .map((t) => `<span class="topic-tag">${t.name}</span>`)
    .join("");

  const url = `https://leetcode.com/problems/${detail.titleSlug}/`;

  let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${detail.title}</title>
            <link rel="stylesheet" type="text/css" href="${cssUri}">
        </head>
        <body>
          <div class="problem-header">
            <h1 class="problem-title">${detail.title}</h1>
            <div class="problem-meta">
              <span class="difficulty ${difficultyClass}">${detail.difficulty}</span>
              <a class="leetcode-link" href="${url}" target="_blank" rel="noopener noreferrer">View on LeetCode ↗</a>
            </div>
            <div class="topics">${topicsHtml}</div>
          </div>
          <hr class="divider" />
      `;

  let content = detail.contentHtml;
  let x = content.indexOf('<p><strong class="example">Example');
  while (x !== -1 && x) {
    // append everything before this example
    html += content.substring(0, x);
    content = content.slice(x);

    // open the wrapper div
    html += '<div class="example-block">';

    // find end of the example, INCLUDING the closing </pre> tag
    x = content.indexOf("</pre>") + "</pre>".length;
    html += content.substring(0, x);

    // close the div AFTER </pre> so nesting is valid
    html += "</div>";
    content = content.slice(x);

    // next example
    x = content.indexOf('<p><strong class="example">Example');
  }
  html += `${content}
        </body>
        </html>`;
  panel.webview.html = html;
  return panel;
}

export function createUploadWebview(
  submissionId: number,
  detail: ProblemDetail,
  context: vscode.ExtensionContext,
) {
  const panel = vscode.window.createWebviewPanel(
    "leetcoder",
    "Submission for: " + detail.title,
    {
      viewColumn: 2,
      preserveFocus: true,
    },
    {
      localResourceRoots: [vscode.Uri.file(context.extensionPath)],
      retainContextWhenHidden: true,
    },
  );
  const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, "src", "style.css"));

  // 2. Convert the disk path to a special Webview URI
  const cssUri = panel.webview.asWebviewUri(onDiskPath);
  let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Custom CSS Webview</title>
            
            <!-- 4. Link the webview-safe URI here -->
            <link rel="stylesheet" type="text/css" href="${cssUri}">
        </head>
        <body>
      `;

  let content = detail.contentHtml;
  // search for all examples
  let x = content.indexOf('<p><strong class="example">Example');
  while (x !== -1 && x) {
    // append everything before this example
    html += content.substring(0, x);
    // remove added content
    content = content.slice(x);
    // append start of div
    html += '<div class="example-block">';
    // find end of the examlple
    x = content.indexOf("</pre>");
    // add example
    html += content.substring(0, x);
    // add end of div
    html += "</div>";
    // remove added content
    content = content.slice(x);
    // next example
    x = content.indexOf('<p><strong class="example">Example');
  }
  // add everything else
  html += `${content}
        </body>
        </html>`;
  panel.webview.html = html;
  return panel;
}
