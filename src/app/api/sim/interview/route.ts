import { NextResponse, type NextRequest } from "next/server";

import {
  AiUnavailableError,
  askJson,
  getProvider,
  isValidProviderName,
  type ErrorKind,
} from "@/lib/ai";
import {
  INTERVIEW_SYSTEM_PROMPT,
  buildInterviewUserPrompt,
  interviewAnswerSchema,
} from "@/lib/interview-prompt";
import { retrieveRelevant } from "@/lib/interview-retrieval";
import type { FeedEntry, Persona, Product } from "@/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const ROUTE_SAFETY_TIMEOUT_MS = 30_000;

const FRIENDLY: Record<ErrorKind, string> = {
  busy: "AI 서비스가 혼잡합니다. 잠시 후 다시 시도해주세요.",
  timeout: "응답이 너무 오래 걸려 중단됐어요. 다시 시도해주세요.",
  network: "네트워크 문제로 연결이 끊겼습니다.",
  auth: "API 키 인증 실패. AI 설정에서 키를 확인해주세요.",
  empty: "AI 응답이 비어 있었어요. 다시 시도해주세요.",
  unknown: "예상치 못한 오류가 발생했습니다.",
};

function statusForKind(kind: ErrorKind): number {
  switch (kind) {
    case "busy":
      return 503;
    case "timeout":
      return 504;
    case "network":
      return 502;
    case "auth":
      return 401;
    case "empty":
      return 502;
    default:
      return 500;
  }
}

type Body = {
  persona?: Persona;
  product?: Product | null;
  feed?: FeedEntry[];
  pinnedSimTime?: string | null;
  question?: string;
  prevMessages?: Array<{ role: "user" | "persona"; content: string }>;
  settings?: { provider?: string; apiKey?: string; model?: string };
};

function withTimeout(upstream: AbortSignal | undefined, ms: number) {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort(), ms);
  if (upstream) {
    if (upstream.aborted) ctl.abort();
    else upstream.addEventListener("abort", () => ctl.abort(), { once: true });
  }
  return { signal: ctl.signal, cleanup: () => clearTimeout(id) };
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다.", kind: "unknown" },
      { status: 400 },
    );
  }

  const { persona, product, question } = body;
  if (!persona || !question || !question.trim()) {
    return NextResponse.json(
      { error: "persona 와 question 이 필요합니다.", kind: "unknown" },
      { status: 400 },
    );
  }

  const feed = Array.isArray(body.feed) ? body.feed : [];
  const pinnedSimTime = body.pinnedSimTime ?? null;
  const prevMessages = Array.isArray(body.prevMessages)
    ? body.prevMessages.slice(-12)
    : [];

  const retrieved = retrieveRelevant(feed, question, 6);

  const userProvider = isValidProviderName(body.settings?.provider)
    ? body.settings.provider
    : undefined;
  const provider = getProvider(userProvider);
  const override =
    userProvider && (body.settings?.apiKey || body.settings?.model)
      ? { apiKey: body.settings?.apiKey, model: body.settings?.model }
      : undefined;

  const tw = withTimeout(req.signal, ROUTE_SAFETY_TIMEOUT_MS);

  try {
    const raw = await askJson(provider, interviewAnswerSchema, {
      system: INTERVIEW_SYSTEM_PROMPT,
      user: buildInterviewUserPrompt({
        persona,
        product: product ?? null,
        pinnedSimTime,
        retrieved,
        question,
        prevMessages,
      }),
      temperature: 0.75,
      maxTokens: 2000,
      signal: tw.signal,
      override,
    });

    return NextResponse.json({
      answer: raw.answer,
      citations: raw.citation_ids,
      retrieved_ids: retrieved.map((r) => r.id),
      provider: provider.name,
    });
  } catch (err) {
    const kind: ErrorKind =
      err instanceof AiUnavailableError ? err.kind : "unknown";
    console.error("[api/sim/interview]", err);
    return NextResponse.json(
      {
        error: FRIENDLY[kind],
        kind,
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: statusForKind(kind) },
    );
  } finally {
    tw.cleanup();
  }
}
