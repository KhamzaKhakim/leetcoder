import {
  Problem,
  ProblemDetail,
  ProblemsetResponse,
  ProblemDetailResponse,
  RawQuestion,
  RawProblemDetail,
  FetchProblemsOptions,
} from "./types";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/";

const PROBLEMSET_QUERY = /* graphql */ `
  query problemsetQuestionList(
    $categorySlug: String
    $limit: Int
    $skip: Int
    $filters: QuestionListFilterInput
  ) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        questionId
        frontendQuestionId: questionFrontendId
        title
        titleSlug
        difficulty
      }
    }
  }
`;

const PROBLEM_DETAIL_QUERY = /* graphql */ `
  query consolePanelConfig($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      questionTitle
      content
      difficulty
      codeSnippets {
        lang
        langSlug
        code
      }
    }
  }
`;

// ─── GraphQL Client ──────────────────────────────────────────────────────────

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `LeetCode API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapQuestion(raw: RawQuestion): Problem {
  return {
    id: parseInt(raw.questionId, 10),
    frontendId: parseInt(raw.frontendQuestionId, 10),
    title: raw.title,
    titleSlug: raw.titleSlug,
    difficulty: raw.difficulty,
  };
}

function mapProblemDetail(raw: RawProblemDetail): ProblemDetail {
  return {
    id: parseInt(raw.questionFrontendId, 10),
    frontendId: parseInt(raw.questionFrontendId, 10),
    title: raw.questionTitle,
    difficulty: raw.difficulty,
    contentHtml: raw.content,
    codeSnippets: raw.codeSnippets,
  };
}

// ─── Problem List ─────────────────────────────────────────────────────────────

export async function fetchProblemList(
  options: FetchProblemsOptions = {},
): Promise<{
  total: number;
  problems: Problem[];
}> {
  const { limit = 1000, skip = 0, categorySlug = "" } = options;

  const json = await gql<ProblemsetResponse>(PROBLEMSET_QUERY, {
    categorySlug,
    limit,
    skip,
    filters: {},
  });

  const { total, questions } = json.data.problemsetQuestionList;

  return {
    total,
    problems: questions.map(mapQuestion),
  };
}

// ─── Problem Detail ───────────────────────────────────────────────────────────

/**
 * Fetches the full detail of a single problem by its titleSlug.
 * e.g. fetchProblemDetail("two-sum")
 */
export async function fetchProblemDetail(
  titleSlug: string,
): Promise<ProblemDetail> {
  const json = await gql<ProblemDetailResponse>(PROBLEM_DETAIL_QUERY, {
    titleSlug,
  });
  return mapProblemDetail(json.data.question);
}
