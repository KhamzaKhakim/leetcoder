import path from "path";
import { Problem, ProblemDetail } from "./types";
import * as vscode from "vscode";
import { webviewRegistry } from "./webviewRegistry";
import { getCookieAndCsrf } from "./utils";

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

interface SubmissionCheckResponse {
  state: "PENDING" | "STARTED" | "SUCCESS" | string;
  status_msg?: string;
  status_runtime?: string;
  status_memory?: string;
  runtime_percentile?: number | null;
  memory_percentile?: number | null;
  total_correct?: number;
  total_testcases?: number;
  compile_error?: string;
  full_compile_error?: string;
  last_testcase?: string;
  expected_output?: string | string[];
  code_output?: string | string[];
  std_output?: string | string[];
}

const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 30; // ~30s ceiling before giving up

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function getUploadHtml(problem: Problem, cssUri: vscode.Uri): string {
  const difficultyClass = problem.difficulty.toLowerCase();

  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Submission - ${problem.title}</title>
            <link rel="stylesheet" type="text/css" href="${cssUri}">
            <style>
              .status-banner {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 14px 16px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 1.05em;
                margin-bottom: 16px;
              }
              .status-banner.pending { background: rgba(255,196,0,0.12); color: #d9a400; }
              .status-banner.accepted { background: rgba(0,180,90,0.12); color: #17a15a; }
              .status-banner.failed { background: rgba(220,60,60,0.12); color: #d9463c; }
 
              .spinner {
                width: 14px; height: 14px;
                border: 2px solid currentColor;
                border-right-color: transparent;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                flex: none;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
 
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 12px;
                margin: 16px 0;
              }
              .stat-card {
                border: 1px solid var(--vscode-panel-border, #444);
                border-radius: 6px;
                padding: 10px 12px;
              }
              .stat-card .label { font-size: 0.75em; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.03em; }
              .stat-card .value { font-size: 1.2em; font-weight: 600; margin-top: 4px; }
 
              .io-label { font-weight: 600; margin-top: 12px; margin-bottom: 4px; }
              pre.io-block {
                background: rgba(127,127,127,0.08);
                padding: 10px 12px;
                border-radius: 6px;
                overflow-x: auto;
                white-space: pre-wrap;
                word-break: break-word;
              }
              .hidden { display: none; }
            </style>
        </head>
        <body>
          <div class="problem-header">
            <h1 class="problem-title">${problem.title}</h1>
            <div class="problem-meta">
              <span class="difficulty ${difficultyClass}">${problem.difficulty}</span>
            </div>
          </div>
          <hr class="divider" />
 
          <div id="status-banner" class="status-banner pending">
            <span class="spinner"></span>
            <span id="status-text">Judging your submission…</span>
          </div>
 
          <div id="stats" class="stats-grid hidden"></div>
          <div id="io-section"></div>
 
          <script>
            const statusBanner = document.getElementById('status-banner');
            const statusText = document.getElementById('status-text');
            const statsEl = document.getElementById('stats');
            const ioEl = document.getElementById('io-section');
 
            function toText(value) {
              if (Array.isArray(value)) return value.join('\\n');
              return value == null ? '' : String(value);
            }
 
            function escapeHtml(str) {
              const div = document.createElement('div');
              div.textContent = str;
              return div.innerHTML;
            }
 
            window.addEventListener('message', (event) => {
              const msg = event.data;
 
              if (msg.type === 'pending') {
                statusText.textContent = 'Judging your submission… (check ' + msg.attempt + ')';
                return;
              }
 
              if (msg.type === 'error') {
                statusBanner.className = 'status-banner failed';
                statusBanner.innerHTML = '<span>⚠️</span><span>' + escapeHtml(msg.message) + '</span>';
                return;
              }
 
              if (msg.type === 'result') {
                renderResult(msg.data);
              }
            });
 
            function renderResult(data) {
              const accepted = data.status_msg === 'Accepted';
              statusBanner.className = 'status-banner ' + (accepted ? 'accepted' : 'failed');
              statusBanner.innerHTML =
                '<span>' + (accepted ? '✅' : '❌') + '</span><span>' + escapeHtml(data.status_msg || 'Judged') + '</span>';
 
              const stats = [];
              if (typeof data.total_correct === 'number' && typeof data.total_testcases === 'number') {
                stats.push(['Testcases', data.total_correct + ' / ' + data.total_testcases]);
              }
              if (data.status_runtime) stats.push(['Runtime', data.status_runtime]);
              if (data.status_memory) stats.push(['Memory', data.status_memory]);
              if (typeof data.runtime_percentile === 'number') {
                stats.push(['Runtime %ile', data.runtime_percentile.toFixed(1) + '%']);
              }
              if (typeof data.memory_percentile === 'number') {
                stats.push(['Memory %ile', data.memory_percentile.toFixed(1) + '%']);
              }
 
              if (stats.length) {
                statsEl.classList.remove('hidden');
                statsEl.innerHTML = stats
                  .map(
                    ([label, value]) =>
                      '<div class="stat-card"><div class="label">' +
                      label +
                      '</div><div class="value">' +
                      escapeHtml(String(value)) +
                      '</div></div>',
                  )
                  .join('');
              }
 
              let ioHtml = '';
              if (data.compile_error) {
                ioHtml +=
                  '<div class="io-label">Compile Error</div><pre class="io-block">' +
                  escapeHtml(toText(data.full_compile_error || data.compile_error)) +
                  '</pre>';
              }
              if (!accepted && data.last_testcase) {
                ioHtml +=
                  '<div class="io-label">Input</div><pre class="io-block">' + escapeHtml(toText(data.last_testcase)) + '</pre>';
              }
              if (!accepted && data.expected_output) {
                ioHtml +=
                  '<div class="io-label">Expected Output</div><pre class="io-block">' +
                  escapeHtml(toText(data.expected_output)) +
                  '</pre>';
              }
              if (!accepted && data.code_output) {
                ioHtml +=
                  '<div class="io-label">Your Output</div><pre class="io-block">' + escapeHtml(toText(data.code_output)) + '</pre>';
              }
              if (data.std_output) {
                ioHtml +=
                  '<div class="io-label">Standard Output</div><pre class="io-block">' + escapeHtml(toText(data.std_output)) + '</pre>';
              }
              ioEl.innerHTML = ioHtml;
            }
          </script>
        </body>
        </html>
      `;
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

  panel.webview.html = getUploadHtml(detail, cssUri);

  let stopped = false;
  panel.onDidDispose(() => {
    stopped = true;
  });

  pollSubmission(submissionId, panel, context, detail.titleSlug, () => stopped);

  return panel;
}
