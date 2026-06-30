import {
  Problem,
  ProblemDetail,
  ProblemListResponse,
  ProblemDetailResponse,
  RawQuestionItem,
  RawQuestionDetail,
  FetchProblemsOptions,
} from "./types";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/";

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

export async function fetchProblemList(
  options: FetchProblemsOptions = {},
): Promise<{
  total: number;
  problems: Problem[];
}> {
  const { limit = 100, skip = 0, categorySlug = "" } = options;

  const json = await gql<ProblemListResponse>(PROBLEMSET_QUERY, {
    categorySlug,
    limit,
    skip,
    filters: {},
  });

  const { total, questions } = json.data.problemsetQuestionList;

  return {
    total,
    problems: questions.map(mapProblem),
  };
}

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

export async function fetchProblemDetail(
  titleSlug: string,
): Promise<ProblemDetail> {
  const json = await gql<ProblemDetailResponse>(PROBLEM_DETAIL_QUERY, {
    titleSlug,
  });
  return mapProblemDetail(json.data.question);
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapProblem(raw: RawQuestionItem): Problem {
  return {
    id: parseInt(raw.questionId, 10),
    frontendId: parseInt(raw.frontendQuestionId, 10),
    title: raw.title,
    titleSlug: raw.titleSlug,
    difficulty: raw.difficulty,
  };
}

function mapProblemDetail(raw: RawQuestionDetail): ProblemDetail {
  return {
    id: parseInt(raw.questionFrontendId, 10),
    frontendId: parseInt(raw.questionFrontendId, 10),
    title: raw.questionTitle,
    difficulty: raw.difficulty,
    contentHtml: raw.content,
    codeSnippets: raw.codeSnippets,
  };
}
