// ─── Problem List ────────────────────────────────────────────────────────────

export interface RawQuestion {
  questionId: string;
  frontendQuestionId: string;
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface ProblemsetResponse {
  data: {
    problemsetQuestionList: {
      total: number;
      questions: RawQuestion[];
    };
  };
}

/** Lightweight problem used in Quick Pick / cache list */
export interface Problem {
  id: number;
  frontendId: number;
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

// ─── Problem Detail ──────────────────────────────────────────────────────────

export interface CodeSnippet {
  lang: string;
  langSlug: string;
  code: string;
}

export interface RawProblemDetail {
  questionId: string;
  questionFrontendId: string;
  questionTitle: string;
  content: string; // raw HTML
  difficulty: "Easy" | "Medium" | "Hard";
  codeSnippets: CodeSnippet[];
}

export interface ProblemDetailResponse {
  data: {
    question: RawProblemDetail;
  };
}

/** Full problem detail opened in the editor */
export interface ProblemDetail {
  id: number;
  frontendId: number;
  title: string;
  contentHtml: string;
  difficulty: "Easy" | "Medium" | "Hard";
  codeSnippets: CodeSnippet[];
}

// ─── Fetcher Options ─────────────────────────────────────────────────────────

export interface FetchProblemsOptions {
  limit?: number;
  skip?: number;
  categorySlug?: string;
}
