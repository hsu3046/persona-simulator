import { AiUnavailableError, type AiProvider, type AskArgs } from "./types";

/**
 * OpenAI — Chat Completions API.
 *
 * Reasoning 모델 판별 (2026-05): gpt-5 계열, o-series 모두 reasoning.
 * gpt-4o, gpt-4o-mini 는 일반.
 */

const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-5.4-mini";

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  error?: { message?: string };
};

type Effort = "minimal" | "low" | "medium" | "high";

function parseEffort(v: string | undefined): Effort | "off" | undefined {
  if (!v) return undefined;
  const s = v.trim().toLowerCase();
  if (s === "off" || s === "none" || s === "false") return "off";
  if (s === "minimal" || s === "low" || s === "medium" || s === "high") return s;
  return undefined;
}

const MAX_TOKENS_MAP: Record<Effort, number> = {
  minimal: 2048,
  low: 4096,
  medium: 16384,
  high: 32768,
};

const ANSWER_ONLY_CAP = 4096;

function isReasoningModel(model: string): boolean {
  // o-series + gpt-5 계열은 reasoning.
  return /^o\d|^gpt-5/i.test(model);
}

export const openaiProvider: AiProvider = {
  name: "openai",
  async ask({
    system,
    user,
    jsonMode,
    temperature = 0.7,
    maxTokens,
    signal,
    override,
  }: AskArgs): Promise<string> {
    const apiKey = override?.apiKey?.trim() || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AiUnavailableError(
        "OPENAI_API_KEY 가 설정되지 않았습니다.",
        "auth",
      );
    }
    const model =
      override?.model?.trim() ||
      process.env.OPENAI_MODEL?.trim() ||
      DEFAULT_MODEL;

    const reasoning = isReasoningModel(model);
    const effortRaw = parseEffort(process.env.OPENAI_REASONING_EFFORT);
    const effort: Effort | "off" = effortRaw ?? "low";

    const max_completion_tokens =
      maxTokens ??
      (reasoning
        ? effort === "off"
          ? ANSWER_ONLY_CAP
          : MAX_TOKENS_MAP[effort]
        : ANSWER_ONLY_CAP);

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_completion_tokens,
    };
    // reasoning 모델은 temperature 미지원 (대부분 1 강제).
    if (!reasoning) {
      body.temperature = temperature;
    } else if (effort !== "off") {
      body.reasoning_effort = effort;
    }
    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    if (signal?.aborted) {
      throw Object.assign(new Error("Aborted"), { name: "AbortError" });
    }

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
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
      throw new AiUnavailableError("busy", "busy");
    }
    if (res.status >= 500) {
      throw new AiUnavailableError(`5xx ${res.status}`, "network");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new AiUnavailableError(
        `${res.status}: ${text.slice(0, 200) || "unknown"}`,
        "unknown",
      );
    }

    const data = (await res.json()) as OpenAIResponse;
    if (data.error) {
      throw new AiUnavailableError(
        data.error.message ?? "openai error",
        "unknown",
      );
    }
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new AiUnavailableError("empty", "empty");
    return raw;
  },
};
