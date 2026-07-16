import * as fs from "fs";

export function renderTemplate(templatePath: string, tokens: Record<string, string>): string {
  let html = fs.readFileSync(templatePath, "utf8");
  for (const [key, value] of Object.entries(tokens)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}
