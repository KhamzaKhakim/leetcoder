import * as vscode from "vscode";
import { SubmissionResponse } from "./types";

export async function upload({
  titleSlug,
  code,
  id,
  context,
}: {
  titleSlug: string;
  code: string;
  id: number;
  context: vscode.ExtensionContext;
}) {
  const cookie = await context.secrets.get("leetcode.cookie");

  if (!cookie) {
    throw new Error("Cookie not found"); //TODO: maybe force login
  }

  const res = await fetch(`https://leetcode.com/problems/${titleSlug}/submit/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrftoken": getCsrfToken(cookie),
      Referer: `https://leetcode.com/problems/${titleSlug}/`,
      Cookie: cookie,
    },
    body: JSON.stringify({
      lang: "typescript",
      question_id: id,
      typed_code: code,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Submit failed: ${res.status} ${res.statusText} — ${errorText}`);
  }

  const json = (await res.json()) as SubmissionResponse;

  return json;
}

export function getUploadCode(code: string) {
  const startMarker = /\/\/\s*@leetcode:start/;
  const endMarker = /\/\/\s*@leetcode:end/;

  const lines = code.split("\n");
  const startIdx = lines.findIndex((line) => startMarker.test(line));
  const endIdx = lines.findIndex((line) => endMarker.test(line));

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return "";
  }

  return lines
    .slice(startIdx + 1, endIdx)
    .join("\n")
    .trim();
}

function getCsrfToken(cookieString: string) {
  const start = cookieString.indexOf("csrftoken=");
  if (start === -1) {
    throw new Error("CSRF cookie not found");
  }

  const valueStart = start + "csrftoken=".length;
  const end = cookieString.indexOf(";", valueStart);

  return end === -1 ? cookieString.slice(valueStart) : cookieString.slice(valueStart, end);
}
