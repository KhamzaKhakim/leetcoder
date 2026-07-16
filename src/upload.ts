import * as vscode from "vscode";
import { Language, SubmissionResponse } from "./types";
import { getConfig, getCookieAndCsrf } from "./utils";

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
  const { cookie, csrfToken } = await getCookieAndCsrf(context);

  const { language } = getConfig();

  const res = await fetch(`https://leetcode.com/problems/${titleSlug}/submit/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrftoken": csrfToken,
      Referer: `https://leetcode.com/problems/${titleSlug}/`,
      Cookie: cookie,
    },
    body: JSON.stringify({
      lang: language,
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
