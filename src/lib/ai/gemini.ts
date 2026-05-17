import { AiUnavailableError, type AiProvider, type AskArgs } from "./types";

/**
 * Google Gemini — generative language API.
 *
 * Thinking 정책 (dreamfulness 참고):
 *   - 3.x: thinkingLevel ("minimal"|"low"|"medium"|"high")
 *   - 2.5: thinkingBudget (token 수)
 *   - default low (env GEMINI_THINKING_EFFORT override)
 *
 * JSON 출력: responseMimeType="application/json" (provider 가 강제).
 */

const DEFAULT_MODEL = "gemini-3-flash-preview";

const endpoint = (model: string, apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }>;
  error?: { message?: string };
};

type Effort = "low" | "medium" | "high";

function parseEffort(v: string | undefined): Effort | "off" | undefined {
  if (!v) return undefined;
  const s = v.trim().toLowerCase();
  if (s === "off" || s === "none" || s === "false") return "off";
  if (s === "low" || s === "medium" || s === "high") return s;
  return undefined;
}

const BUDGET_MAP: Record<Effort, number> = {
  low: 1024,
  medium: 8192,
  high: 24576,
};

function buildThinkingConfig(
  model: string,
  effort: Effort | "off",
): Record<string, unknown> | null {
  if (effort === "off") {
    if (model.startsWith("gemini-2.5")) return { thinkingBudget: 0 };
    if (model === "gemini-3-flash") return { thinkingLevel: "minimal" };
    return null;
  }
  if (model.startsWith("gemini-3")) {
    return { thinkingLevel: effort };
  }
  if (model.startsWith("gemini-2.5")) {
    return { thinkingBudget: BUDGET_MAP[effort] };
  }
  return { thinkingLevel: effort };
}

const ANSWER_RESERVE = 4096;

export const geminiProvider: AiProvider = {
  name: "google",
  async ask({
    system,
    user,
    jsonMode,
    temperature = 0.7,
    maxTokens,
    signal,
    override,
  }: AskArgs): Promise<string> {
    const apiKey = override?.apiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AiUnavailableError(
        "GEMINI_API_KEY 가 설정되지 않았습니다.",
        "auth",
      );
    }
    const model =
      override?.model?.trim() ||
      process.env.GEMINI_MODEL?.trim() ||
      DEFAULT_MODEL;

    const effort: Effort | "off" =
      parseEffort(process.env.GEMINI_THINKING_EFFORT) ?? "low";
    const thinkingConfig = buildThinkingConfig(model, effort);

    const isV3 = model.startsWith("gemini-3");
    let maxOutputTokens: number;
    if (maxTokens) {
      maxOutputTokens = maxTokens;
    } else if (effort === "off") {
      maxOutputTokens = ANSWER_RESERVE;
    } else if (isV3) {
      const v3Budget: Record<Effort, number> = {
        low: 2048,
        medium: 8192,
        high: 16384,
      };
      maxOutputTokens = v3Budget[effort] + ANSWER_RESERVE;
    } else {
      maxOutputTokens = BUDGET_MAP[effort] + ANSWER_RESERVE;
    }

    const generationConfig: Record<string, unknown> = {
      temperature,
      maxOutputTokens,
    };
    if (thinkingConfig) generationConfig.thinkingConfig = thinkingConfig;
    if (jsonMode) generationConfig.responseMimeType = "application/json";

    if (signal?.aborted) {
      throw Object.assign(new Error("Aborted"), { name: "AbortError" });
    }

    let res: Response;
    try {
      res = await fetch(endpoint(model, apiKey), {
        method: "POST",
        signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: system }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: user }],
            },
          ],
          generationConfig,
        }),
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
    if (res.status === 429) throw new AiUnavailableError("busy", "busy");
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

    const data = (await res.json()) as GeminiResponse;
    if (data.error) {
      throw new AiUnavailableError(
        data.error.message ?? "gemini error",
        "unknown",
      );
    }
    const raw =
      data.candidates?.[0]?.content?.parts
        ?.filter((p) => !p.thought)
        .map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";
    if (!raw) throw new AiUnavailableError("empty", "empty");
    return raw;
  },
};
