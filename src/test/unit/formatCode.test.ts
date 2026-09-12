// import * as assert from "assert";
// import { formatCode } from "../../formatCode";

// const START = "// @leetcode:start";
// const END = "// @leetcode:end";

// // Real snippet returned by LeetCode for "add-two-numbers" in TypeScript.
// const LINKED_LIST_SNIPPET = `/**
//  * Definition for singly-linked list.
//  * class ListNode {
//  *     val: number
//  *     next: ListNode | null
//  *     constructor(val?: number, next?: ListNode | null) {
//  *         this.val = (val===undefined ? 0 : val)
//  *         this.next = (next===undefined ? null : next)
//  *     }
//  * }
//  */

// function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {

// };`;

// const PLAIN_SNIPPET = `function twoSum(nums: number[], target: number): number[] {

// };`;

// suite("formatCode", () => {
//   test("wraps a plain snippet in start/end markers", () => {
//     const { code, cursor } = formatCode(PLAIN_SNIPPET, "typescript");

//     assert.strictEqual(code, `${START}\n${PLAIN_SNIPPET}\n${END}\n`);
//     assert.strictEqual(cursor, 1, "cursor should point at the first line after the start marker");
//   });

//   test("uses the same markers for javascript", () => {
//     const { code } = formatCode(PLAIN_SNIPPET, "javascript");
//     const lines = code.split("\n");

//     assert.strictEqual(lines[0], START);
//     assert.strictEqual(lines[lines.length - 2], END);
//   });

//   test("hoists a Definition block above the start marker as real code", () => {
//     const { code, cursor } = formatCode(LINKED_LIST_SNIPPET, "typescript");

//     const expectedDefinition = [
//       "// Definition for singly-linked list.",
//       "class ListNode {",
//       "    val: number",
//       "    next: ListNode | null",
//       "    constructor(val?: number, next?: ListNode | null) {",
//       "        this.val = (val===undefined ? 0 : val)",
//       "        this.next = (next===undefined ? null : next)",
//       "    }",
//       "}",
//     ].join("\n");

//     const expectedBody =
//       "function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {\n    \n};";

//     assert.strictEqual(code, `${expectedDefinition}\n\n${START}\n${expectedBody}\n${END}\n`);
//     assert.strictEqual(cursor, 11, "cursor should be the first line after the start marker");
//   });

//   test("cursor line always points just past the start marker", () => {
//     for (const snippet of [PLAIN_SNIPPET, LINKED_LIST_SNIPPET]) {
//       const { code, cursor } = formatCode(snippet, "typescript");
//       const lines = code.split("\n");
//       assert.strictEqual(lines[cursor - 1], START);
//     }
//   });

//   test("handles multiple Definition blocks", () => {
//     const snippet = `/**
//  * Definition for a binary tree node.
//  * class TreeNode {
//  *     val: number
//  * }
//  */
// /**
//  * Definition for singly-linked list.
//  * class ListNode {
//  *     val: number
//  * }
//  */

// function solve(root: TreeNode | null): ListNode | null {

// };`;

//     const { code } = formatCode(snippet, "typescript");

//     assert.ok(code.includes("// Definition for a binary tree node.\nclass TreeNode {"));
//     assert.ok(code.includes("// Definition for singly-linked list.\nclass ListNode {"));
//     assert.ok(!code.includes("/**"), "no block comment should remain");
//     assert.ok(code.indexOf("class ListNode") < code.indexOf(START));
//     assert.ok(code.indexOf(START) < code.indexOf("function solve"));
//   });

//   test("leaves the snippet body untouched (no reindent or trailing-space changes)", () => {
//     const { code } = formatCode(PLAIN_SNIPPET, "typescript");
//     assert.ok(
//       code.includes("{\n    \n}"),
//       "the indented blank line inside the function is preserved",
//     );
//   });
// });
