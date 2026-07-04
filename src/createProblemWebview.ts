import path from "path";
import { ProblemDetail } from "./types";
import * as vscode from "vscode";

export function createProblemWebview(detail: ProblemDetail, context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "leetcoder",
    detail.title,
    {
      viewColumn: 2,
      preserveFocus: true,
    },
    {
      localResourceRoots: [vscode.Uri.file(context.extensionPath)],
      retainContextWhenHidden: true, // Keeps the site loaded even if the user switches tabs
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
