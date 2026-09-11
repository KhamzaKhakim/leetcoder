import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { renderTemplate } from "../../webviews/helper";

suite("renderTemplate", () => {
  let dir: string;

  const write = (name: string, content: string) => {
    const file = path.join(dir, name);
    fs.writeFileSync(file, content, "utf8");
    return file;
  };

  setup(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "leetcoder-template-"));
  });

  teardown(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test("substitutes every occurrence of a token", () => {
    const file = write("t.html", "<title>{{title}}</title><h1>{{title}}</h1>");
    assert.strictEqual(
      renderTemplate(file, { title: "Two Sum" }),
      "<title>Two Sum</title><h1>Two Sum</h1>",
    );
  });

  test("substitutes several different tokens", () => {
    const file = write("t.html", "{{a}}-{{b}}-{{a}}");
    assert.strictEqual(renderTemplate(file, { a: "1", b: "2" }), "1-2-1");
  });

  test("leaves tokens that were not provided untouched", () => {
    const file = write("t.html", "{{known}} {{unknown}}");
    assert.strictEqual(renderTemplate(file, { known: "x" }), "x {{unknown}}");
  });

  test("does not expand replacement patterns like $& inside values", () => {
    const file = write("t.html", "[{{content}}]");
    assert.strictEqual(
      renderTemplate(file, { content: "cost is $5 and $& and $' and $1" }),
      "[cost is $5 and $& and $' and $1]",
    );
  });

  test("renders the real problem template with its expected tokens", () => {
    const real = path.join(__dirname, "..", "..", "..", "src", "webviews", "problem", "index.html");
    const html = renderTemplate(real, {
      title: "Two Sum",
      cssUri: "vscode-resource://style.css",
      difficulty: "Easy",
      difficultyClass: "easy",
      url: "https://leetcode.com/problems/two-sum/",
      content: "<p>Body</p>",
      topicsHtml: '<span class="topic-tag">Array</span>',
    });

    assert.ok(html.includes("<title>Two Sum</title>"));
    assert.ok(html.includes('class="difficulty easy"'));
    assert.ok(html.includes("<p>Body</p>"));
    assert.ok(!html.includes("{{"), "every token in the template should be filled");
  });
});
