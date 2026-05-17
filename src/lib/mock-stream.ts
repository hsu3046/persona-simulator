// 모든 페르소나 × 제품 조합에 대해 24시간 mock stream 생성.
// Phase 8 의 Mastra+Inngest 가 할 일을 절차적으로 재현.

import { STREAM_PARK_JIYOUNG } from "@/mocks/stream-park-jiyoung";
import type {
  Emotion,
  Exposure,
  FeedEntry,
  FunnelStage,
  FunnelTransition,
  LifeEntry,
  MediaChannel,
  Persona,
  Product,
} from "@/types";

// ── 시간 도우미 ──
function setTime(base: string, hour: number, minute: number): string {
  const d = base.split("T")[0] ?? "2026-05-16";
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${d}T${hh}:${mm}:00`;
}

function pickIdSeed(p: Persona): number {
  let h = 0;
  for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) >>> 0;
  return h;
}

function mulberry32(a: number) {
  return function rand() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 데일리 라이프 템플릿 ──
const ROUTINE_TEMPLATES: Array<{
  hour: number;
  minute: number;
  type: LifeEntry["type"];
  template: (p: Persona) => Pick<LifeEntry, "diary" | "action_summary" | "emotion" | "location">;
}> = [
  {
    hour: 7,
    minute: 0,
    type: "routine",
    template: (p) => ({
      diary: `아침. ${p._sim.children_count > 0 ? "아이 깨우고 등원 준비." : "출근 준비."} 시간이 빠듯하다.`,
      action_summary: "기상 / 아침 준비",
      emotion: { valence: 0.2, arousal: 0.5 },
      location: "집",
    }),
  },
  {
    hour: 8,
    minute: 30,
    type: "work",
    template: (p) => ({
      diary: `출근길. ${p._sim.media_channels[0]?.channel ?? "휴대폰"} 스크롤하며 이동.`,
      action_summary: "출근",
      emotion: { valence: 0.25, arousal: 0.4 },
      location: `${p._sim.region.city} ${p._sim.region.district}`,
    }),
  },
  {
    hour: 10,
    minute: 30,
    type: "consumption",
    template: () => ({
      diary: "오전 카페 한 잔. 이 돈도 매일 모이면 만만치 않다는 거 알지만…",
      action_summary: "카페 음료 구매",
      emotion: { valence: 0.4, arousal: 0.5 },
      location: "스타벅스",
    }),
  },
  {
    hour: 12,
    minute: 30,
    type: "social",
    template: () => ({
      diary: "점심. 동료와 짧은 잡담. 신용카드 얘기 또 나옴.",
      action_summary: "점심 식사",
      emotion: { valence: 0.4, arousal: 0.45 },
      location: "회사 근처",
    }),
  },
  {
    hour: 15,
    minute: 0,
    type: "work",
    template: () => ({
      diary: "오후 업무. 집중력 떨어짐.",
      action_summary: "오후 업무",
      emotion: { valence: -0.05, arousal: 0.55 },
    }),
  },
  {
    hour: 18,
    minute: 30,
    type: "routine",
    template: () => ({
      diary: "퇴근. 지하철에서 또 인스타.",
      action_summary: "퇴근 이동",
      emotion: { valence: 0.2, arousal: 0.35 },
      location: "지하철",
    }),
  },
  {
    hour: 20,
    minute: 0,
    type: "leisure",
    template: (p) => ({
      diary: `${p._sim.children_count > 0 ? "아이 재우고 " : ""}거실. 유튜브.`,
      action_summary: "휴식",
      emotion: { valence: 0.4, arousal: 0.35 },
      location: "집",
    }),
  },
  {
    hour: 22,
    minute: 30,
    type: "reflection",
    template: () => ({
      diary: "오늘 본 광고들이 머릿속에 맴돈다. 내일 한 번 알아봐야겠다.",
      action_summary: "취침 전 생각 정리",
      emotion: { valence: 0.35, arousal: 0.3 },
      location: "침실",
    }),
  },
];

// funnel 진행 가능 여부 — 단계별 임계
const STAGE_ORDER: FunnelStage[] = [
  "unaware",
  "aware",
  "interested",
  "considering",
  "intent",
  "trial",
  "purchase",
  "repeat",
  "advocate",
];

function nextStage(current: FunnelStage): FunnelStage {
  const i = STAGE_ORDER.indexOf(current);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return current;
  return STAGE_ORDER[i + 1] ?? current;
}

// ── Exposure 생성 ──
interface ExposureContext {
  persona: Persona;
  product: Product;
  channel: MediaChannel;
  hour: number;
  minute: number;
  priorCount: number;
  funnelBefore: FunnelStage;
  rand: () => number;
}

function generateExposure(ctx: ExposureContext): {
  exposure: Exposure;
  transition: FunnelTransition | null;
} {
  const { persona, product, channel, hour, minute, priorCount, funnelBefore, rand } = ctx;
  const ts = setTime("2026-05-16", hour, minute);
  const channelPlan = product.channels.find((c) => c.channel === channel);
  const mediaHabit = persona._sim.media_channels.find((m) => m.channel === channel);

  const attention = clamp01(
    (mediaHabit?.receptivity_to_ads ?? 0.4) * (0.5 + rand() * 0.7),
  );
  const switchProb = persona._sim.category_preferences[product.category]?.willing_to_switch ?? 0.4;
  // 노출 영향력 = attention × switch_prob × frequency boost
  const impact = attention * switchProb * (priorCount > 0 ? 1.2 : 0.85);
  const advance = impact > 0.32 && rand() < impact;
  const funnelAfter: FunnelStage = advance ? nextStage(funnelBefore) : funnelBefore;

  const reasoning = composeReasoning(persona, product, channel, priorCount, advance);
  const valence = advance ? 0.55 + rand() * 0.25 : 0.1 + rand() * 0.2;
  const arousal = 0.35 + attention * 0.4;

  const exposure: Exposure = {
    id: `ex-${persona.id}-${ts}`,
    persona_id: persona.id,
    product_id: product.id,
    sim_timestamp: ts,
    channel,
    context: channelContext(channel, hour),
    attention_level: round2(attention),
    prior_exposure_count: priorCount,
    message_received: channelPlan?.creative_summary || product.positioning,
    funnel_stage_before: funnelBefore,
    funnel_stage_after: funnelAfter,
    internal_reasoning: reasoning,
    emotional_response: { valence: round2(valence), arousal: round2(arousal) },
    action_taken: pickAction(funnelAfter, attention, rand),
  };

  const transition: FunnelTransition | null = advance
    ? {
        id: `ft-${persona.id}-${ts}`,
        persona_id: persona.id,
        product_id: product.id,
        sim_timestamp: ts,
        from_stage: funnelBefore,
        to_stage: funnelAfter,
        trigger_exposure_id: exposure.id,
        reasoning: `${priorCount + 1}회 누적 노출 + attention ${(attention * 100).toFixed(0)}% × 전환 의향 ${(switchProb * 100).toFixed(0)}%`,
      }
    : null;

  return { exposure, transition };
}

function channelContext(channel: MediaChannel, hour: number): string {
  const time = hour < 12 ? "오전" : hour < 18 ? "오후" : "저녁";
  switch (channel) {
    case "instagram":
      return `${time} 인스타그램 피드`;
    case "youtube":
      return `${time} 유튜브 시청 중 광고`;
    case "tiktok":
      return `${time} 틱톡 영상 중간`;
    case "subway_ad":
      return "지하철 스크린도어 / 차내 영상";
    case "word_of_mouth":
      return "지인/동료 추천";
    case "blog_review":
      return "블로그 리뷰 검색 결과";
    case "naver_search":
    case "google_search":
      return "검색 결과 광고 영역";
    case "kakao_talk":
      return "카톡 채널 / 친구톡";
    case "tv":
      return `${time} TV 광고`;
    default:
      return `${time} ${channel}`;
  }
}

function composeReasoning(
  persona: Persona,
  product: Product,
  channel: MediaChannel,
  priorCount: number,
  advanced: boolean,
): string {
  if (channel === "word_of_mouth") {
    return advanced
      ? `${persona.basic.name === persona.basic.name ? "동료가" : "친구가"} 직접 쓴다고? 광고로만 보던 거랑 달라.`
      : "추천은 고맙지만 일단 듣고만 흘려보내.";
  }
  if (priorCount === 0) {
    return `처음 보는 ${product.name}. ${advanced ? "괜찮은데?" : "흔한 광고 같아 일단 넘김."}`;
  }
  if (priorCount >= 4) {
    return advanced
      ? `오늘 ${priorCount + 1}번째. 어쩐지 마음에 남는다. 한 번 알아봐야겠어.`
      : `또 그 광고. 알겠어, 알겠어.`;
  }
  return advanced
    ? `${priorCount + 1}번째 노출. 이번엔 좀 다르게 들리는데.`
    : `${priorCount + 1}번 봤지만 아직 와닿진 않아.`;
}

function pickAction(
  stage: FunnelStage,
  attention: number,
  rand: () => number,
): Exposure["action_taken"] {
  if (attention < 0.3) return "ignore";
  if (stage === "intent" || stage === "trial") {
    return rand() < 0.6 ? "click" : "search";
  }
  if (stage === "considering") return "save";
  if (stage === "interested") return rand() < 0.5 ? "save" : "ask_friend";
  return "ignore";
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── 한 페르소나 × 제품 → 24시간 stream ──
export function generateMockStream(persona: Persona, product: Product): FeedEntry[] {
  // 박지영은 손으로 작성한 고품질 stream 사용
  if (persona.id === "persona-park-jiyoung" && product.id === "prod-cashback-card-01") {
    return STREAM_PARK_JIYOUNG;
  }

  const rand = mulberry32(pickIdSeed(persona));
  const entries: FeedEntry[] = [];

  // 1) Life entries — 정해진 routine
  for (const tpl of ROUTINE_TEMPLATES) {
    const body = tpl.template(persona);
    const le: LifeEntry = {
      id: `le-${persona.id}-${tpl.hour}-${tpl.minute}`,
      persona_id: persona.id,
      sim_timestamp: setTime("2026-05-16", tpl.hour, tpl.minute),
      type: tpl.type,
      diary: body.diary,
      action_summary: body.action_summary,
      emotion: body.emotion as Emotion,
      ...(body.location ? { location: body.location } : {}),
    };
    entries.push({ kind: "life", data: le });
  }

  // 2) Exposures — 페르소나 미디어 습관 ∩ 제품 채널, 시간대별로 사건 분포
  const matchedChannels: MediaChannel[] = product.channels
    .map((c) => c.channel)
    .filter((ch) =>
      persona._sim.media_channels.some(
        (m) => m.channel === ch && m.daily_minutes > 0,
      ),
    );

  if (matchedChannels.length === 0 && product.channels.length > 0) {
    // 매칭 없으면 제품의 top 채널 1개로 강제 노출 (예: subway, word_of_mouth 같이 미디어 습관에 안 잡힐 수 있음)
    matchedChannels.push(product.channels[0]!.channel);
  }

  const exposureSlots = [
    { hour: 8, minute: 5 },
    { hour: 10, minute: 35 },
    { hour: 12, minute: 50 },
    { hour: 18, minute: 15 },
    { hour: 21, minute: 20 },
    { hour: 22, minute: 10 },
  ];

  let funnel: FunnelStage = "unaware";
  let priorCount = 0;

  for (const slot of exposureSlots) {
    if (matchedChannels.length === 0) break;
    if (rand() < 0.25) continue; // 가끔 skip
    const channel = matchedChannels[Math.floor(rand() * matchedChannels.length)]!;
    const { exposure, transition } = generateExposure({
      persona,
      product,
      channel,
      hour: slot.hour,
      minute: slot.minute,
      priorCount,
      funnelBefore: funnel,
      rand,
    });
    entries.push({ kind: "exposure", data: exposure });
    priorCount++;
    if (transition) {
      funnel = transition.to_stage;
      entries.push({ kind: "funnel", data: transition });
    }
  }

  // 시간순 정렬
  entries.sort((a, b) => {
    const ta = getTs(a);
    const tb = getTs(b);
    return ta.localeCompare(tb);
  });

  return entries;
}

function getTs(e: FeedEntry): string {
  return e.kind === "life"
    ? e.data.sim_timestamp
    : e.kind === "exposure"
      ? e.data.sim_timestamp
      : e.data.sim_timestamp;
}
