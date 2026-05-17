import { NextResponse, type NextRequest } from "next/server";

import {
  AiUnavailableError,
  askJson,
  getProvider,
  isValidProviderName,
  type ErrorKind,
} from "@/lib/ai";
import {
  buildUserPrompt,
  personaBatchSchema,
  SYSTEM_PROMPT,
} from "@/lib/persona-prompt";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const ROUTE_SAFETY_TIMEOUT_MS = 60_000;

const FRIENDLY: Record<ErrorKind, string> = {
  busy: "AI 서비스가 혼잡합니다. 잠시 후 다시 시도해주세요.",
  timeout: "응답이 너무 오래 걸려 중단됐어요. 다시 시도해주세요.",
  network: "네트워크 문제로 연결이 끊겼습니다. 다시 시도해주세요.",
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
  marketing_goal?: string;
  target_description?: string;
  count?: number;
  settings?: {
    provider?: string;
    apiKey?: string;
    model?: string;
  };
};

function withTimeout(upstream: AbortSignal | undefined, ms: number) {
  const ctl = new AbortController();
  let timedOut = false;
  const id = setTimeout(() => {
    timedOut = true;
    ctl.abort();
  }, ms);
  if (upstream) {
    if (upstream.aborted) ctl.abort();
    else upstream.addEventListener("abort", () => ctl.abort(), { once: true });
  }
  return {
    signal: ctl.signal,
    cleanup: () => clearTimeout(id),
    isTimeout: () => timedOut,
  };
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

  const marketing_goal = (body.marketing_goal ?? "").trim();
  const target_description = (body.target_description ?? "").trim();
  const count = Math.max(
    1,
    Math.min(typeof body.count === "number" ? body.count : 5, 8),
  );

  if (!marketing_goal) {
    return NextResponse.json(
      { error: "마케팅 목적을 입력해주세요.", kind: "unknown" },
      { status: 400 },
    );
  }

  const userProvider = isValidProviderName(body.settings?.provider)
    ? body.settings.provider
    : undefined;
  const provider = getProvider(userProvider);
  const override =
    userProvider && (body.settings?.apiKey || body.settings?.model)
      ? {
          apiKey: body.settings?.apiKey,
          model: body.settings?.model,
        }
      : undefined;

  const tw = withTimeout(req.signal, ROUTE_SAFETY_TIMEOUT_MS);

  try {
    const result = await askJson(provider, personaBatchSchema, {
      system: SYSTEM_PROMPT,
      user: buildUserPrompt({ marketing_goal, target_description, count }),
      temperature: 0.8,
      maxTokens: 16384,
      signal: tw.signal,
      override,
    });

    console.log("[api/personas/generate] returning", {
      provider: provider.name,
      count: result.personas.length,
      names: result.personas.map((p) => p.basic?.name),
    });

    return NextResponse.json({
      personas: result.personas,
      provider: provider.name,
    });
  } catch (err) {
    console.error("[api/personas/generate] error:", err);
    if (err instanceof AiUnavailableError) {
      const kind: ErrorKind = tw.isTimeout() ? "timeout" : err.kind;
      return NextResponse.json(
        { error: FRIENDLY[kind], kind },
        { status: statusForKind(kind) },
      );
    }
    if ((err as Error)?.name === "AbortError") {
      const kind: ErrorKind = tw.isTimeout() ? "timeout" : "unknown";
      return NextResponse.json(
        { error: FRIENDLY[kind], kind },
        { status: statusForKind(kind) },
      );
    }
    const message = (err as Error)?.message ?? "unknown";
    return NextResponse.json(
      { error: `${FRIENDLY.unknown}: ${message}`, kind: "unknown" },
      { status: 500 },
    );
  } finally {
    tw.cleanup();
  }
}
