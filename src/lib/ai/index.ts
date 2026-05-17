import { z } from "zod";

import { claudeProvider } from "./claude";
import { geminiProvider } from "./gemini";
import { openaiProvider } from "./openai";
import { openrouterProvider } from "./openrouter";
import {
  AiUnavailableError,
  type AiProvider,
  type AskArgs,
  type ProviderName,
} from "./types";

export type { AiProvider, AskArgs, AiOverride, ErrorKind, ProviderName } from "./types";
export { AiUnavailableError } from "./types";

/**
 * Provider 결정. caller 가 명시 안 하면 env AI_PROVIDER, 그 다음 openrouter default.
 */
export function getProvider(name?: string): AiProvider {
  const which = (name ?? process.env.AI_PROVIDER ?? "openrouter").toLowerCase();
  switch (which) {
    case "anthropic":
    case "claude":
      return claudeProvider;
    case "openai":
      return openaiProvider;
    case "google":
    case "gemini":
      return geminiProvider;
    case "openrouter":
    default:
      return openrouterProvider;
  }
}

export function isValidProviderName(v: unknown): v is ProviderName {
  return (
    v === "openrouter" ||
    v === "openai" ||
    v === "anthropic" ||
    v === "google"
  );
}

/**
 * JSON 응답을 받아 Zod 로 검증한 typed object 반환.
 * 모델이 prefix/suffix 텍스트 섞어 보내는 케이스 방지 위해 첫 `{` ~ 마지막 `}` 만 추출.
 */
export async function askJson<T>(
  provider: AiProvider,
  schema: z.ZodType<T>,
  args: Omit<AskArgs, "jsonMode">,
): Promise<T> {
  const raw = await provider.ask({ ...args, jsonMode: true });
  const text = extractJsonBlock(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new AiUnavailableError(
      `Invalid JSON: ${(e as Error).message}. Raw: ${raw.slice(0, 200)}`,
      "unknown",
    );
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    // raw output 의 키들 + 첫 issue 의 path 로 디버깅 힌트 노출
    const keys =
      parsed && typeof parsed === "object"
        ? Object.keys(parsed as object)
        : [];
    console.error(
      "[askJson] schema mismatch — keys:",
      keys,
      "issues:",
      result.error.issues.slice(0, 3),
      "raw sample:",
      JSON.stringify(parsed).slice(0, 500),
    );
    const issueSummary = result.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(" | ");
    throw new AiUnavailableError(
      `JSON schema mismatch: ${issueSummary}`,
      "unknown",
    );
  }
  return result.data;
}

function extractJsonBlock(text: string): string {
  const t = text.trim();
  // 코드펜스 제거
  const fenceMatch = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenceMatch ? fenceMatch[1]!.trim() : t;
  const first = body.indexOf("{");
  const last = body.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return body;
  return body.slice(first, last + 1);
}
