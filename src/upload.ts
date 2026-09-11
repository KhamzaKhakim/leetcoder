import * as vscode from "vscode";
import { SubmissionResponse } from "./types";
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
