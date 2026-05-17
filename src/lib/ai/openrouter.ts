import { AiUnavailableError, type AiProvider, type AskArgs } from "./types";

/**
 * OpenRouter — 한 키로 다양한 frontier 모델. OpenAI-compatible.
 * 패턴: dreamfulness/lib/ai/openrouter.ts 참고. 명상 도메인 의존 제거.
 *
 * 정책:
 *   - Model fallback opt-in (OPENROUTER_FALLBACK_MODELS env)
 *   - Reasoning effort default low (env override)
 *   - 자체 timeout 없음 — caller signal 만 의존
 *   - Stream 미사용 (JSON 응답 받아 한 번에 parse)
 */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-v4-pro";

type ReasoningEffort = "low" | "medium" | "high" | "xhigh";
const REASONING_EFFORT_DEFAULT: ReasoningEffort = "low";

const ANSWER_RESERVE = 4096;
const REASONING_BUDGET: Record<ReasoningEffort, number> = {
  low: 2048,
  medium: 8192,
  high: 16384,
  xhigh: 32768,
};

function parseEffort(
  v: string | undefined,
): ReasoningEffort | "off" | undefined {
  if (!v) return undefined;
  const s = v.trim().toLowerCase();
  if (s === "off" || s === "none" || s === "false") return "off";
  if (s === "low" || s === "medium" || s === "high" || s === "xhigh") return s;
  return undefined;
}

function parseList(envVal: string | undefined): string[] | undefined {
  if (!envVal) return undefined;
  const arr = envVal
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length > 0 ? arr : undefined;
}

type OpenAICompatResponse = {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  error?: { message?: string };
};

export const openrouterProvider: AiProvider = {
  name: "openrouter",
  async ask({
    system,
    user,
    jsonMode,
    temperature = 0.7,
    maxTokens,
    signal,
    override,
  }: AskArgs): Promise<string> {
    const apiKey = override?.apiKey?.trim() || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new AiUnavailableError(
        "OPENROUTER_API_KEY 가 설정되지 않았습니다.",
        "auth",
      );
    }
    const model =
      override?.model?.trim() ||
      process.env.OPENROUTER_MODEL?.trim() ||
      DEFAULT_MODEL;

    const fallbackModels = parseList(process.env.OPENROUTER_FALLBACK_MODELS);
    const models = fallbackModels
      ? [model, ...fallbackModels.filter((m) => m !== model)]
      : undefined;

    const effortEnv = parseEffort(process.env.OPENROUTER_REASONING_EFFORT);
    const effort: ReasoningEffort | null =
      effortEnv === "off" ? null : (effortEnv ?? REASONING_EFFORT_DEFAULT);
    const max_tokens =
      maxTokens ??
      (effort ? REASONING_BUDGET[effort] + ANSWER_RESERVE : ANSWER_RESERVE);

    const headers: Record<string, string> = {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    };
    const referer = process.env.OPENROUTER_SITE_URL?.trim();
    if (referer) headers["http-referer"] = referer;
    const title = process.env.OPENROUTER_SITE_NAME?.trim();
    if (title) headers["x-title"] = title;

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens,
      temperature,
    };
    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }
    if (models) body.models = models;
    if (effort) {
      body.reasoning = { enabled: true, effort };
    }

    if (signal?.aborted) {
      throw Object.assign(new Error("Aborted"), { name: "AbortError" });
    }

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        signal,
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (signal?.aborted) {
        throw Object.assign(new Error("Aborted"), { name: "AbortError" });
      }
      throw new AiUnavailableError(
        `fetch failed: ${(err as Error)?.message ?? "unknown"}`,
        "network",
      );
    }

    if (res.status === 401 || res.status === 403) {
      throw new AiUnavailableError("auth", "auth");
    }
    if (res.status === 429) {
      throw new AiUnavailableError("busy 429", "busy");
    }
    if (res.status >= 500) {
      const kind = res.status === 503 ? "busy" : "network";
      throw new AiUnavailableError(`${res.status}`, kind);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new AiUnavailableError(
        `${res.status}: ${text.slice(0, 200) || "unknown"}`,
        "unknown",
      );
    }

    const data = (await res.json()) as OpenAICompatResponse;
    if (data.error) {
      throw new AiUnavailableError(
        data.error.message ?? "openrouter error",
        "unknown",
      );
    }
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new AiUnavailableError("empty", "empty");
    return raw;
  },
};
