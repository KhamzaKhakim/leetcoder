import * as vscode from "vscode";
import { Problem, ProblemCache } from "./types";
import { fetchProblemList } from "./fetcher";
import { FILE_NAME } from "./constants";

// const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

//TODO: implement caching logic;
//TODO: when i close and open quickpick again two seperate fetching begins
export async function getProblemList(
  context: vscode.ExtensionContext,
  onBatch: (problems: Problem[]) => void,
  state: {
    isFetching: boolean;
  },
): Promise<Problem[]> {
  context.globalState.get("leetcoder.fetching-problems");
  const cacheFile = vscode.Uri.joinPath(context.globalStorageUri, FILE_NAME);
  console.log(cacheFile.path);

  try {
    const raw = await vscode.workspace.fs.readFile(cacheFile);
    const cached: ProblemCache = JSON.parse(new TextDecoder().decode(raw));
    // if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.problems;
    // }
  } catch {}

  // Fetch all pages
  const allProblems: Problem[] = [];
  let skip = 0;
  const limit = 100;
  let total = Infinity;

  state.isFetching = true;
  while (allProblems.length < total) {
    const response = await fetchProblemList({ skip, limit });
    total = response.total;
    allProblems.push(...response.problems);
    onBatch(allProblems);
    skip += limit;
  }

  await vscode.workspace.fs.createDirectory(context.globalStorageUri);
  const payload: ProblemCache = {
    problems: allProblems,
    total: allProblems.length,
    fetchedAt: Date.now(),
  };
  await vscode.workspace.fs.writeFile(cacheFile, new TextEncoder().encode(JSON.stringify(payload)));

  state.isFetching = false;

  return allProblems;
}

export async function getProblemListUpload(context: vscode.ExtensionContext): Promise<Problem[]> {
  const cacheFile = vscode.Uri.joinPath(context.globalStorageUri, FILE_NAME);

  const raw = await vscode.workspace.fs.readFile(cacheFile);
  const cached: ProblemCache = JSON.parse(new TextDecoder().decode(raw));
  // if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
  return cached.problems;
}
