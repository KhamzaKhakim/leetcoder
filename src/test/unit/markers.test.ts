import * as assert from "assert";
import { getUploadCode } from "../../markers";

suite("getUploadCode", () => {
  test("returns only the code between the markers", () => {
    const file = [
      "class ListNode {}",
      "",
      "// @leetcode:start",
      "function solve(): number {",
      "  return 1;",
      "}",
      "// @leetcode:end",
      "",
      "console.log(solve());",
    ].join("\n");

    assert.strictEqual(getUploadCode(file), "function solve(): number {\n  return 1;\n}");
  });

  test("trims blank lines around the extracted block", () => {
    const file = "// @leetcode:start\n\n\nconst x = 1;\n\n// @leetcode:end\n";
    assert.strictEqual(getUploadCode(file), "const x = 1;");
  });

  test("tolerates extra whitespace inside the marker comments", () => {
    const file = "//    @leetcode:start\nconst x = 1;\n//\t@leetcode:end";
    assert.strictEqual(getUploadCode(file), "const x = 1;");
  });

  test("returns an empty string when the start marker is missing", () => {
    assert.strictEqual(getUploadCode("const x = 1;\n// @leetcode:end"), "");
  });

  test("returns an empty string when the end marker is missing", () => {
    assert.strictEqual(getUploadCode("// @leetcode:start\nconst x = 1;"), "");
  });

  test("returns an empty string when the markers are in the wrong order", () => {
    assert.strictEqual(getUploadCode("// @leetcode:end\nconst x = 1;\n// @leetcode:start"), "");
  });

  test("returns an empty string when the markers are adjacent", () => {
    assert.strictEqual(getUploadCode("// @leetcode:start\n// @leetcode:end"), "");
  });

  test("uses the first pair of markers when there are several", () => {
    const file = [
      "// @leetcode:start",
      "first",
      "// @leetcode:end",
      "// @leetcode:start",
      "second",
      "// @leetcode:end",
    ].join("\n");
    assert.strictEqual(getUploadCode(file), "first");
  });
});
