// ─── Problem List ────────────────────────────────────────────────────────────

type Difficulty = "Easy" | "Medium" | "Hard";

export interface RawQuestionItem {
  questionId: string;
  frontendQuestionId: string;
  title: string;
  titleSlug: string;
  difficulty: Difficulty;
}

export interface ProblemListResponse {
  data: {
    problemsetQuestionList: {
      total: number;
      questions: RawQuestionItem[];
    };
  };
}

/** Lightweight problem used in Quick Pick / cache list */
export interface Problem {
  id: number;
  frontendId: number;
  title: string;
  titleSlug: string;
  difficulty: Difficulty;
}

// ─── Problem Detail ──────────────────────────────────────────────────────────

export interface CodeSnippet {
  lang: string;
  langSlug: string;
  code: string;
}

export interface RawQuestionDetail {
  questionId: string;
  questionFrontendId: string;
  questionTitle: string;
  content: string; // raw HTML
  difficulty: Difficulty;
  codeSnippets: CodeSnippet[];
}

export interface ProblemDetailResponse {
  data: {
    question: RawQuestionDetail;
  };
}

/** Full problem detail opened in the editor */
export interface ProblemDetail {
  id: number;
  frontendId: number;
  title: string;
  contentHtml: string;
  difficulty: Difficulty;
  codeSnippets: CodeSnippet[];
}

// ─── Fetcher Options ─────────────────────────────────────────────────────────

export interface FetchProblemsOptions {
  limit?: number;
  skip?: number;
  categorySlug?: string;
}
