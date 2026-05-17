import { AiUnavailableError, type AiProvider, type AskArgs } from "./types";

/**
 * Anthropic Claude — direct API.
 *
 * Extended thinking:
 *   - default low. env ANTHROPIC_THINKING_EFFORT override.
 *   - opus-4.7 은 manual enabled 거부 → off 강제.
 *   - thinking ON 시 temperature 1 강제.
 *
 * JSON 출력은 prefill "{" + 안내문으로 유도 (Anthropic 은 response_format 미지원).
 */

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { type?: string; message?: string };
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
  low: 2048,
  medium: 8192,
  high: 16384,
};
const ANSWER_RESERVE = 4096;

export const claudeProvider: AiProvider = {
  name: "anthropic",
  async ask({
    system,
    user,
    jsonMode,
    temperature = 0.7,
    maxTokens,
    signal,
    override,
  }: AskArgs): Promise<string> {
    const apiKey = override?.apiKey?.trim() || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AiUnavailableError(
        "ANTHROPIC_API_KEY 가 설정되지 않았습니다.",
        "auth",
      );
    }
    const model =
      override?.model?.trim() ||
      process.env.ANTHROPIC_MODEL?.trim() ||
      DEFAULT_MODEL;

    const isOpus47 = model.startsWith("claude-opus-4-7");
    const effortRaw: Effort | "off" =
      parseEffort(process.env.ANTHROPIC_THINKING_EFFORT) ?? "low";
    const effort: Effort | "off" = isOpus47 ? "off" : effortRaw;

    let max_tokens: number;
    let thinkingBlock: Record<string, unknown> | null = null;
    if (effort === "off") {
      max_tokens = maxTokens ?? ANSWER_RESERVE;
    } else {
      const budget = BUDGET_MAP[effort];
      max_tokens = maxTokens ?? budget + ANSWER_RESERVE;
      thinkingBlock = { type: "enabled", budget_tokens: budget };
    }

    // JSON mode: system 에 명시 + assistant prefill "{" (모델이 JSON 으로 이어쓰게).
    const sysText = jsonMode
      ? `${system}\n\nReturn a single JSON object only. No prose before or after.`
      : system;

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      { role: "user", content: user },
    ];
    if (jsonMode) {
      messages.push({ role: "assistant", content: "{" });
    }

    const body: Record<string, unknown> = {
      model,
      max_tokens,
      system: [
        {
          type: "text",
          text: sysText,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    };
    if (thinkingBlock) {
      body.thinking = thinkingBlock;
      // thinking ON: temperature 1 만 허용
    } else {
      body.temperature = temperature;
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
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
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
    if (res.status === 429 || res.status === 529) {
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

    const data = (await res.json()) as AnthropicResponse;
    const raw =
      data.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim() ?? "";

    if (!raw) {
      throw new AiUnavailableError("empty", "empty");
    }
    // JSON prefill 했으면 "{" 가 빠져있으므로 다시 prepend
    return jsonMode ? `{${raw}` : raw;
  },
};
