// dreamfulness AI 레이어 패턴 — 4 provider 지원 + BYOK + 일관된 에러 매핑.
// Persona-simulator 용으로 generic 화 (도메인 무관, system/user prompt 직접 받음).

export type ProviderName = "openrouter" | "openai" | "anthropic" | "google";

export type AiOverride = {
  apiKey?: string;
  model?: string;
};

export type AskArgs = {
  system: string;
  user: string;
  /** true 면 JSON 응답 요청 (가능한 provider 만 response_format/mime 사용). */
  jsonMode?: boolean;
  temperature?: number;
  /** Reasoning + answer 합산 cap. 미지정 시 provider 별 default. */
  maxTokens?: number;
  signal?: AbortSignal;
  override?: AiOverride;
};

export interface AiProvider {
  name: ProviderName;
  ask(args: AskArgs): Promise<string>;
}

/**
 * 사용자에게 보일 에러 분류.
 *  - busy     : 429/503/upstream rate limit
 *  - timeout  : 우리 타임아웃 초과
 *  - network  : fetch fail
 *  - auth     : 401/403 — API 키 문제
 *  - empty    : 응답 비어있음
 *  - unknown  : 그 외
 */
export type ErrorKind =
  | "busy"
  | "timeout"
  | "network"
  | "auth"
  | "empty"
  | "unknown";

export class AiUnavailableError extends Error {
  kind: ErrorKind;
  constructor(message: string, kind: ErrorKind = "unknown") {
    super(message);
    this.name = "AiUnavailableError";
    this.kind = kind;
  }
}
