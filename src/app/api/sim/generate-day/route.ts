import { NextResponse, type NextRequest } from "next/server";

import {
  AiUnavailableError,
  askJson,
  getProvider,
  isValidProviderName,
  type ErrorKind,
} from "@/lib/ai";
import {
  buildNarrativeSystemPrompt,
  buildNarrativeUserPrompt,
  simDayNarrativeSchema,
  type ExposureNarrativeRaw,
  type LifeEntryRaw,
} from "@/lib/sim-day-prompt";
import { planSimulationDay, type PlannedExposure } from "@/lib/sim-day-planner";
import type { SimDuration } from "@/lib/sim-duration";
import type {
  Exposure,
  FeedEntry,
  LifeEntry,
  Persona,
  Product,
} from "@/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// 페르소나 1명의 24h 생성 — reasoning 켜져 있으면 더 길어질 수 있으니 여유.
const ROUTE_SAFETY_TIMEOUT_MS = 90_000;

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
  persona?: Persona;
  product?: Product;
  /** 시뮬 날짜 baseline. 미지정 시 오늘 (KST). */
  sim_date?: string;
  /** "24h" | "7d" | "30d" — 미지정 시 24h. */
  duration?: SimDuration;
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

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** baseDate (YYYY-MM-DD) 에 day offset, hour, minute 를 더한 로컬 ISO. */
function toIso(
  baseDate: string,
  day: number,
  hour: number,
  minute: number,
): string {
  const d = new Date(`${baseDate}T00:00:00`);
  d.setDate(d.getDate() + day);
  d.setHours(hour, minute, 0, 0);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * planner 출력 + LLM narrative → FeedEntry[] 조립.
 * exposures 의 outcome 은 planner 가 결정한 값 사용 (LLM 결정 무시).
 * narrative 필드만 LLM 에서 받아옴.
 */
function assembleNarrativeStream({
  personaId,
  productId,
  simDate,
  plannedExposures,
  raw,
}: {
  personaId: string;
  productId: string;
  simDate: string;
  plannedExposures: PlannedExposure[];
  raw: {
    life_entries: LifeEntryRaw[];
    exposure_narratives: ExposureNarrativeRaw[];
  };
}): FeedEntry[] {
  const life: LifeEntry[] = raw.life_entries.map((e) => {
    const ts = toIso(simDate, e.day, e.hour, e.minute);
    const out: LifeEntry = {
      id: `le-${personaId}-${newId()}`,
      persona_id: personaId,
      sim_timestamp: ts,
      type: e.type,
      diary: e.diary,
      action_summary: e.action_summary,
      emotion: e.emotion,
      ...(e.location ? { location: e.location } : {}),
      ...(e.spend
        ? {
            spend: {
              category: e.spend.category,
              amount: e.spend.amount,
              currency: "KRW",
              ...(e.spend.brand ? { brand: e.spend.brand } : {}),
            },
          }
        : {}),
    };
    return out;
  });

  // narrative index → object
  const narrativeByIndex = new Map<number, ExposureNarrativeRaw>();
  for (const n of raw.exposure_narratives) {
    narrativeByIndex.set(n.index, n);
  }

  // plannedExposures 이미 시간순. LLM narrative 와 1:1 매핑.
  const exposures: Exposure[] = plannedExposures.map((p, idx) => {
    const ts = toIso(simDate, p.day, p.hour, p.minute);
    const nar = narrativeByIndex.get(idx);
    return {
      id: `ex-${personaId}-${newId()}`,
      persona_id: personaId,
      product_id: productId,
      sim_timestamp: ts,
      channel: p.channel,
      context: nar?.context ?? `${p.channel} 노출`,
      attention_level: p.attention_level,
      prior_exposure_count: p.prior_exposure_count,
      message_received: nar?.message_received ?? "광고 메시지",
      funnel_stage_before: p.funnel_stage_before,
      funnel_stage_after: p.funnel_stage_after,
      internal_reasoning: nar?.internal_reasoning ?? "",
      emotional_response: nar?.emotional_response ?? { valence: 0, arousal: 0.3 },
      ...(nar?.action_taken ? { action_taken: nar.action_taken } : {}),
    };
  });

  // funnel transitions: exposure 의 before != after 만 추출
  const funnels = exposures
    .filter((e) => e.funnel_stage_before !== e.funnel_stage_after)
    .map((e) => ({
      id: `ft-${e.id}`,
      persona_id: personaId,
      product_id: productId,
      sim_timestamp: e.sim_timestamp,
      from_stage: e.funnel_stage_before,
      to_stage: e.funnel_stage_after,
      trigger_exposure_id: e.id,
      reasoning: e.internal_reasoning.slice(0, 80),
    }));

  // FeedEntry 형태로 합쳐 시간순 정렬
  const all: FeedEntry[] = [
    ...life.map((data) => ({ kind: "life" as const, data })),
    ...exposures.map((data) => ({ kind: "exposure" as const, data })),
    ...funnels.map((data) => ({ kind: "funnel" as const, data })),
  ];
  all.sort((a, b) => {
    const ta =
      a.kind === "life"
        ? a.data.sim_timestamp
        : a.kind === "exposure"
          ? a.data.sim_timestamp
          : a.data.sim_timestamp;
    const tb =
      b.kind === "life"
        ? b.data.sim_timestamp
        : b.kind === "exposure"
          ? b.data.sim_timestamp
          : b.data.sim_timestamp;
    return ta.localeCompare(tb);
  });
  return all;
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

  const persona = body.persona;
  const product = body.product;
  if (!persona || !product) {
    return NextResponse.json(
      { error: "persona / product 가 필요합니다.", kind: "unknown" },
      { status: 400 },
    );
  }

  const simDate = body.sim_date?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? body.sim_date
    : "2026-05-16";

  const duration: SimDuration =
    body.duration === "24h" || body.duration === "7d" || body.duration === "30d"
      ? body.duration
      : "24h";

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

  // ─── Step 1: marketing engine 으로 deterministic 노출 sequence 결정 ───
  const planned = planSimulationDay({ persona, product, duration });

  try {
    // ─── Step 2: LLM 에 narrative 만 요청 ───
    const raw = await askJson(provider, simDayNarrativeSchema, {
      system: buildNarrativeSystemPrompt(duration),
      user: buildNarrativeUserPrompt({
        persona,
        product,
        duration,
        plannedExposures: planned.exposures,
      }),
      temperature: 0.85,
      maxTokens: duration === "30d" ? 32000 : duration === "7d" ? 24000 : 16000,
      signal: tw.signal,
      override,
    });

    const stream = assembleNarrativeStream({
      personaId: persona.id,
      productId: product.id,
      simDate,
      plannedExposures: planned.exposures,
      raw,
    });

    console.log("[api/sim/generate-day] returning", {
      provider: provider.name,
      persona: persona.basic.name,
      planned_exposures: planned.exposures.length,
      life: raw.life_entries.length,
      narratives: raw.exposure_narratives.length,
      total_entries: stream.length,
    });

    return NextResponse.json({
      stream,
      meta: {
        persona_id: persona.id,
        product_id: product.id,
        provider: provider.name,
        life_count: raw.life_entries.length,
        exposure_count: planned.exposures.length,
      },
    });
  } catch (err) {
    console.error("[api/sim/generate-day] error:", err);
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
