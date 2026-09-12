import * as assert from "assert";
import { extractCsrfToken } from "../../utils";

suite("extractCsrfToken", () => {
  test("reads the token when it is the first cookie", () => {
    assert.strictEqual(extractCsrfToken("csrftoken=abc123; LEETCODE_SESSION=xyz"), "abc123");
  });

  test("reads the token when it is in the middle", () => {
    assert.strictEqual(extractCsrfToken("a=1; csrftoken=abc123; b=2"), "abc123");
  });

  test("reads the token when it is the last cookie with no trailing semicolon", () => {
    assert.strictEqual(extractCsrfToken("LEETCODE_SESSION=xyz; csrftoken=abc123"), "abc123");
  });

  test("returns an empty string for an empty token value", () => {
    assert.strictEqual(extractCsrfToken("csrftoken=; other=1"), "");
  });

  test("throws when no csrftoken is present", () => {
    assert.throws(() => extractCsrfToken("LEETCODE_SESSION=xyz"), /CSRF cookie not found/);
  });
});
