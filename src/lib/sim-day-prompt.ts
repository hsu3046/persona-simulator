import { z } from "zod";

import { SIM_DURATIONS, type SimDuration } from "@/lib/sim-duration";
import type { Persona, Product } from "@/types";

/**
 * 한 페르소나의 N 기간 시뮬레이션 stream 생성.
 * duration: 24h / 7d / 30d — 해상도와 entry 수가 다름.
 *
 * 비용 최적화 — 전체 기간을 페르소나당 1 LLM 호출로 받음.
 * 5 페르소나 = 5 calls (병렬).
 */

// ── Enums with catch fallbacks (Zod 검증이 LLM 약간 어겨도 깨지지 않도록) ──
const lifeType = z
  .enum(["routine", "work", "consumption", "social", "leisure", "reflection"])
  .catch("routine");

const funnelStage = z
  .enum([
    "unaware",
    "aware",
    "interested",
    "considering",
    "intent",
    "trial",
    "purchase",
    "repeat",
    "advocate",
    "churned",
  ])
  .catch("unaware");

const actionTaken = z
  .enum([
    "ignore",
    "click",
    "save",
    "search",
    "ask_friend",
    "visit_store",
    "purchase",
  ])
  .catch("ignore");

const channel = z
  .enum([
    "instagram",
    "youtube",
    "tiktok",
    "naver_search",
    "google_search",
    "kakao_talk",
    "tv",
    "subway_ad",
    "outdoor_ad",
    "word_of_mouth",
    "blog_review",
    "podcast",
    "email",
    "push_notification",
  ])
  .catch("instagram");

const emotion = z.object({
  valence: z.number().min(-1).max(1).catch(0),
  arousal: z.number().min(0).max(1).catch(0.5),
});

const lifeEntryRaw = z.object({
  /** 시뮬 시작일 기준 day offset (0-29). 24h 모드는 항상 0. */
  day: z.number().int().min(0).max(30).catch(0),
  hour: z.number().int().min(0).max(23).catch(12),
  minute: z.number().int().min(0).max(59).catch(0),
  type: lifeType,
  diary: z.string().catch(""),
  action_summary: z.string().catch(""),
  emotion: emotion.catch({ valence: 0, arousal: 0.3 }),
  location: z.string().optional(),
  spend: z
    .object({
      category: z.string(),
      amount: z.number().int().min(0).catch(0),
      brand: z.string().optional(),
    })
    .optional(),
});

const exposureRaw = z.object({
  day: z.number().int().min(0).max(30).catch(0),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).catch(0),
  channel: channel,
  context: z.string().min(1),
  attention_level: z.number().min(0).max(1).catch(0.4),
  message_received: z.string().min(1),
  funnel_stage_before: funnelStage,
  funnel_stage_after: funnelStage,
  internal_reasoning: z.string().min(1),
  emotional_response: emotion,
  action_taken: actionTaken.optional(),
});

export const simDaySchema = z.object({
  life_entries: z.array(lifeEntryRaw).min(1).max(40),
  exposures: z.array(exposureRaw).min(0).max(30),
});

export type SimDayRaw = z.infer<typeof simDaySchema>;
export type LifeEntryRaw = z.infer<typeof lifeEntryRaw>;
export type ExposureRaw = z.infer<typeof exposureRaw>;

// ─────────────────────────────────────────────────
// Narrative-only mode (Plan §9.5)
// 서버가 planSimulationDay() 로 노출 sequence + funnel 결정.
// LLM 은 각 노출의 narrative 필드만 작성:
//   - context (어떤 상황·맥락에서 봤는지)
//   - message_received (페르소나가 인지한 메시지)
//   - internal_reasoning (1인칭 사고 — system1/system2 톤)
//   - emotional_response
//   - action_taken
// 그리고 life_entries 는 여전히 LLM 이 자유 생성 (일반 라이프 로그는 마케팅 핵심 아님).
// ─────────────────────────────────────────────────

const exposureNarrativeRaw = z.object({
  /** planner index — caller 가 id 로 매칭 */
  index: z.number().int().min(0).catch(0),
  context: z.string().catch(""),
  message_received: z.string().catch(""),
  internal_reasoning: z.string().catch(""),
  emotional_response: emotion.catch({ valence: 0, arousal: 0.3 }),
  action_taken: actionTaken.optional(),
});

export const simDayNarrativeSchema = z.object({
  // 빈 array 도 허용 — LLM 이 life_entries 를 안 채워도 깨지지 않음
  life_entries: z.array(lifeEntryRaw).max(40).catch([]),
  exposure_narratives: z.array(exposureNarrativeRaw).catch([]),
});

export type ExposureNarrativeRaw = z.infer<typeof exposureNarrativeRaw>;
export type SimDayNarrativeRaw = z.infer<typeof simDayNarrativeSchema>;

// ── Prompt builders ──

function durationDescription(duration: SimDuration): string {
  switch (duration) {
    case "24h":
      return "하루 (06:00-23:59) 의 분 단위 일기·행동·광고 노출";
    case "7d":
      return "1주 (7일) 의 시간대 단위 (아침/점심/저녁/밤) 라이프 변화·반복 노출·funnel 진행";
    case "30d":
      return "한 달 (30일) 의 하이라이트 위주 — 매일 모든 시간을 채우지 말고 의미 있는 사건만. 누적 노출 효과·funnel 진전 강조";
  }
}

export function buildSystemPrompt(duration: SimDuration): string {
  const meta = SIM_DURATIONS[duration];
  return `당신은 가상 고객 시뮬레이션의 1인칭 일기 작가이자 행동 모델링 전문가입니다.
주어진 한국 페르소나의 **${durationDescription(duration)}** 를 사실적으로 시뮬레이션해 JSON 으로 생성합니다.

원칙:
- 페르소나의 직업·가족·소득·미디어 습관에 맞는 현실적 routine.
- 각 entry 의 diary 는 **1인칭, 짧은 문장 1-2 줄**. 페르소나의 톤·말투 반영.
- exposures 는 **persona.media_channels ∩ product.channels** 매칭 + product.targeting 충족 시에만 발생.
- 노출 시 **internal_reasoning** 은 1인칭으로 솔직하게.
- funnel 전환 (before → after) 은 누적 노출 횟수 + attention + persona 가치관 + product 정합성 종합.
  * 첫 노출 attention 낮으면 unaware → unaware/aware
  * 3-5회 노출 + 동료 추천 매칭 시 → considering, intent
  * 가격 민감 페르소나에 비싼 제품 = funnel 진전 X
- 시간 필드: **day (0-${duration === "24h" ? "0" : duration === "7d" ? "6" : "29"}) + hour (0-23) + minute (0-59)** 정수. ISO 형식 X.

📏 **${meta.label} 시뮬레이션 분량 가이드**:
- life_entries: ${meta.entryGuidance.lifeMin}-${meta.entryGuidance.lifeMax}개
- exposures: ${meta.entryGuidance.exposureMin}-${meta.entryGuidance.exposureMax}개
${
  duration === "7d"
    ? "- 7일 모드: 각 day 마다 아침(6-11)/점심(12-14)/저녁(18-21)/밤(22-24) 시간대 위주. 매일 모든 시간 채우지 말 것.\n- 광고 노출은 며칠에 걸쳐 반복돼야 frequency 효과 검증 가능."
    : duration === "30d"
      ? "- 30일 모드: 매일 entry 만들지 말 것. 의미 있는 변화·사건이 있는 날 중심.\n- 페르소나가 광고를 처음 본 날, 3-5회 누적 후, 검토 시작한 날, 결정한 날 등 critical moment 포착.\n- 30일 전체에 걸쳐 day 분산 (몇 주 동안 천천히 funnel 진전)."
      : "- 24시간 모드: day 는 모두 0. 분 단위까지 세밀하게 (예: 07:32, 12:45)."
}

⚠️ enum 값은 정확히 영문으로:
- life_entries.type: "routine" | "work" | "consumption" | "social" | "leisure" | "reflection"
- exposures.channel: "instagram" | "youtube" | "tiktok" | "naver_search" | "google_search" | "kakao_talk" | "tv" | "subway_ad" | "outdoor_ad" | "word_of_mouth" | "blog_review" | "podcast" | "email" | "push_notification"
- exposures.funnel_stage_before/after: "unaware" | "aware" | "interested" | "considering" | "intent" | "trial" | "purchase" | "repeat" | "advocate" | "churned"
- exposures.action_taken: "ignore" | "click" | "save" | "search" | "ask_friend" | "visit_store" | "purchase"

JSON 만 반환. 부가 설명·markdown fence 금지.`;
}

export function buildUserPrompt({
  persona,
  product,
  duration,
}: {
  persona: Persona;
  product: Product;
  duration: SimDuration;
}): string {
  const meta = SIM_DURATIONS[duration];
  const durationLabel = meta.label;
  return `# 페르소나
이름: ${persona.basic.name}
${persona.basic.age_range} · ${persona.basic.occupation}
디지털 숙련도: ${persona.basic.digital_literacy}

## 핵심 정보
목표:
${persona.goals.map((g) => `- ${g}`).join("\n")}

Pain Point:
${persona.pain_points.map((p) => `- ${p}`).join("\n")}

행동 패턴:
${persona.behaviors.map((b) => `- ${b}`).join("\n")}

트리거: ${persona.triggers.join(", ")}
장벽: ${persona.barriers.join(", ")}
반응 메시지: ${persona.resonating_messages.join(", ")}

## 시뮬 보조
- 결혼: ${persona._sim.marital_status}, 자녀 ${persona._sim.children_count}명${persona._sim.children_ages.length > 0 ? ` (${persona._sim.children_ages.join(", ")}세)` : ""}
- 주거: ${persona._sim.housing}, ${persona._sim.region.city} ${persona._sim.region.district}
- 월소득: ${persona._sim.income_monthly_krw.toLocaleString("ko-KR")}원 (${persona._sim.income_decile}분위)
- 가격 민감도: ${(persona._sim.price_sensitivity * 100).toFixed(0)}%
- 브랜드 충성도: ${(persona._sim.brand_loyalty * 100).toFixed(0)}%
- 신제품 수용: ${persona._sim.innovation_adoption}

미디어 습관 (분/일):
${persona._sim.media_channels
  .map(
    (m) =>
      `- ${m.channel}: ${m.daily_minutes}분, 광고 수용 ${(m.receptivity_to_ads * 100).toFixed(0)}%`,
  )
  .join("\n")}

카테고리별 기존 선호:
${Object.entries(persona._sim.category_preferences)
  .map(
    ([cat, pref]) =>
      `- ${cat}: 현재 "${pref.current_brand ?? "없음"}", 만족 ${(pref.satisfaction * 100).toFixed(0)}%, 전환의향 ${(pref.willing_to_switch * 100).toFixed(0)}%`,
  )
  .join("\n")}

---

# 마케팅 시뮬 대상 제품·서비스
**${product.name}** (${product.category}) — ${product.price_krw > 0 ? `${product.price_krw.toLocaleString("ko-KR")}원` : "무료/구독"}

포지셔닝: "${product.positioning}"

핵심 가치:
${product.unique_value_props.map((v) => `- ${v}`).join("\n")}

경쟁 브랜드: ${product.competitor_brands.join(", ") || "—"}

광고 채널 plan:
${product.channels
  .map(
    (c) =>
      `- ${c.channel} (예산 ${(c.spend_share * 100).toFixed(0)}%): "${c.creative_summary}"${
        c.targeting
          ? ` · 타겟: ${[
              c.targeting.age_range
                ? `${c.targeting.age_range[0]}-${c.targeting.age_range[1]}세`
                : "",
              c.targeting.regions?.join("/"),
            ]
              .filter(Boolean)
              .join(", ")}`
          : ""
      }`,
  )
  .join("\n")}

---

# 출력
${persona.basic.name} 의 ${durationLabel} 을(를) 다음 JSON 으로 반환하세요. 모든 entry 는 \`day\` (시작일 = 0), \`hour\`, \`minute\` 필드 필수.

\`\`\`json
{
  "life_entries": [
    {
      "day": 0,
      "hour": 7,
      "minute": 0,
      "type": "routine",
      "diary": "1인칭 일기 1-2줄",
      "action_summary": "3인칭 행동 요약",
      "emotion": { "valence": 0.2, "arousal": 0.5 },
      "location": "집",
      "spend": { "category": "카페", "amount": 4500, "brand": "스타벅스" }
    }
  ],
  "exposures": [
    {
      "day": 0,
      "hour": 7,
      "minute": 55,
      "channel": "instagram",
      "context": "출근길 인스타 피드",
      "attention_level": 0.25,
      "message_received": "광고에서 받아들인 메시지",
      "funnel_stage_before": "unaware",
      "funnel_stage_after": "aware",
      "internal_reasoning": "또 카드 광고. 근데 '월 5만원' 이라는 숫자가 눈에 들어왔어.",
      "emotional_response": { "valence": 0.15, "arousal": 0.35 },
      "action_taken": "ignore"
    }
  ]
}
\`\`\`

규칙:
- spend 필드는 실제 지출이 있을 때만 (선택). 출근/통근/일반 행동엔 없음.
- 페르소나가 product 와 잘 안 맞으면 exposures 0개도 OK (강제로 끼워넣지 말 것).
- internal_reasoning 은 페르소나 톤으로.
- prior_exposure_count 는 자동 계산되므로 출력하지 마세요.`;
}

// ─────────────────────────────────────────────────
// Narrative-only prompt builders (Plan §9.5-9.6)
// ─────────────────────────────────────────────────

import type { PlannedExposure } from "@/lib/sim-day-planner";

const FUNNEL_KO: Record<string, string> = {
  unaware: "모름",
  aware: "알게 됨",
  interested: "관심",
  considering: "고민 중",
  intent: "사고 싶음",
  trial: "체험",
  purchase: "구매",
  repeat: "재구매",
  advocate: "추천 중",
  churned: "관심 끊음",
};

const CHANNEL_KO: Record<string, string> = {
  instagram: "인스타그램",
  youtube: "유튜브",
  tiktok: "틱톡",
  naver_search: "네이버 검색",
  google_search: "구글 검색",
  kakao_talk: "카카오톡",
  tv: "TV",
  subway_ad: "지하철 광고",
  outdoor_ad: "옥외 광고",
  word_of_mouth: "입소문",
  blog_review: "블로그 리뷰",
  podcast: "팟캐스트",
  email: "이메일",
  push_notification: "푸시 알림",
};

export function buildNarrativeSystemPrompt(duration: SimDuration): string {
  const meta = SIM_DURATIONS[duration];
  return `당신은 가상 고객 시뮬레이션의 **1인칭 일기 작가** 입니다.
서버의 마케팅 엔진이 페르소나의 광고 노출 sequence (시간·채널·attention·funnel 단계 변화) 를 이미 결정했습니다.
당신의 역할은 각 노출 사건에 페르소나 톤의 narrative (맥락·인지 메시지·1인칭 사고·감정·행동) 만 작성하는 것입니다.

주어진 outcome 을 절대 바꾸지 마세요 — 시간/채널/attention/funnel 은 입력 그대로 유지.
당신은 그 결정을 1인칭 살로 옷 입힐 뿐입니다.

📐 **${meta.label} 시뮬레이션 분량** (둘 다 필수, 빈 배열 금지):
- **life_entries**: 반드시 ${meta.entryGuidance.lifeMin}-${meta.entryGuidance.lifeMax}개 — 식사·출근·일·여가·취침 등 일반 라이프 로그. 광고와 무관한 일상 사건. 노출 카드 사이를 채우는 페르소나의 하루 흐름. **이 배열이 비면 안 됨.**
- **exposure_narratives**: 입력 받은 노출 수와 **정확히 같은 수**, index 1:1 매칭

🧠 **1인칭 사고 톤** — 페르소나의 cognitive_mode 따라:
- **system1** (직관적·peripheral route): 1문장, 짧고 정서적, 명사 위주. 예: "또 그 광고. 좋아 보이긴 해."
- **system2** (분석적·central route): 2-3문장, 계산·비교·가정문. 예: "월 5만원이면 연 60만원. 내 신한카드 적립률 0.5% 라 한 달 1만원 수준. 만약 진짜 4% 면 5배네."

🎯 **메시지 인지의 현실성**:
- 페르소나는 광고 카피 그대로 인지하지 않음. attention 낮으면 단편적·왜곡된 인지
- attention 0.2-0.4: "뭐 5만원 어쩌고 했는데..." 식 단편
- attention 0.5-0.8: 핵심 키워드 기억
- attention 0.85+: 카피 거의 정확히 인지

🎭 **Cialdini 시그널 활용** — 광고에 사회증명/한정/권위/무료/캐릭터/일관성 등이 있고 페르소나가 그것에 민감하면 internal_reasoning 에 반영:
- social_proof → "친구 다 쓴다고 했지", "리뷰 많네"
- scarcity → "오늘까지래", "선착순이라니"
- authority → "전문가 추천이래"
- reciprocity → "무료라니까 한 번"
- liking → "그 연예인이 광고하네"

⚠️ enum 값 영문 정확히:
- emotion: { valence: -1 ~ 1, arousal: 0 ~ 1 }
- action_taken: "ignore" | "click" | "save" | "search" | "ask_friend" | "visit_store" | "purchase"
- life_entries.type / day / hour / minute 는 자유 (24h 모드면 day=0)

JSON 만 반환. 부가 설명·markdown fence 금지.`;
}

export function buildNarrativeUserPrompt({
  persona,
  product,
  duration,
  plannedExposures,
}: {
  persona: Persona;
  product: Product;
  duration: SimDuration;
  plannedExposures: PlannedExposure[];
}): string {
  const eventLines = plannedExposures
    .map((e, i) => {
      const signals = Object.entries(e.meta.creative_signals)
        .filter(([, v]) => v)
        .map(([k]) => k.replace("has_", ""))
        .join(", ") || "(특별 시그널 없음)";
      const stageChange =
        e.funnel_stage_before === e.funnel_stage_after
          ? `${FUNNEL_KO[e.funnel_stage_before]} 유지`
          : `${FUNNEL_KO[e.funnel_stage_before]} → ${FUNNEL_KO[e.funnel_stage_after]}`;
      const dayLabel = duration === "24h" ? "" : `D+${e.day} `;
      const gateNote = e.meta.ma_gate.passed
        ? ""
        : `\n  · ⚠️ Sharp Mental Availability gate 미통과 — 우리 브랜드가 페르소나의 카테고리 brand pool 에 못 들어감 (광고 봐도 잘 기억 안 남)`;
      return `[index ${i}] ${dayLabel}${pad2(e.hour)}:${pad2(e.minute)} — ${CHANNEL_KO[e.channel] ?? e.channel}
  · attention ${(e.attention_level * 100).toFixed(0)}% (${e.attention_level >= 0.6 ? "주목" : e.attention_level >= 0.35 ? "보통" : "낮음"})
  · cognitive_mode: ${e.meta.cognitive_mode === "system1" ? "직관적(system1)" : "분석적(system2)"}
  · 누적 ${e.prior_exposure_count + 1}회차 (시간 가중 effective ${e.meta.effective_prior_exposures.toFixed(1)}회)
  · funnel: ${stageChange}
  · Cialdini 시그널: ${signals}
  · 메시지 적합도: ${(e.meta.message_match * 100).toFixed(0)}%${gateNote}`;
    })
    .join("\n\n");

  return `# 페르소나
이름: ${persona.basic.name}
${persona.basic.age_range} · ${persona.basic.occupation}
디지털 숙련도: ${persona.basic.digital_literacy}

목표: ${persona.goals.slice(0, 3).join(" / ")}
Pain Point: ${persona.pain_points.slice(0, 3).join(" / ")}
반응 메시지: ${persona.resonating_messages.join(", ")}
장벽: ${persona.barriers.slice(0, 3).join(" / ")}

# 제품·서비스
**${product.name}** (${product.category}) — ${product.price_krw > 0 ? `${product.price_krw.toLocaleString("ko-KR")}원` : "무료/구독"}
포지셔닝: "${product.positioning}"
USP: ${product.unique_value_props.slice(0, 3).join(" / ")}

광고 채널 plan:
${product.channels
  .map(
    (c) =>
      `- ${CHANNEL_KO[c.channel] ?? c.channel}: "${c.creative_summary}"`,
  )
  .join("\n")}

---

# 서버가 결정한 노출 사건 (이 outcome 을 narrative 로 옷 입히세요)

${eventLines || "(이 페르소나는 이 제품에 노출되지 않습니다. exposure_narratives 는 빈 배열 반환)"}

---

# 출력 — JSON

\`\`\`json
{
  "life_entries": [
    {
      "day": 0,
      "hour": 7,
      "minute": 0,
      "type": "routine",
      "diary": "1인칭 일기",
      "action_summary": "3인칭 요약",
      "emotion": { "valence": 0.2, "arousal": 0.5 },
      "location": "집",
      "spend": { "category": "카페", "amount": 4500, "brand": "스타벅스" }
    }
  ],
  "exposure_narratives": [
    {
      "index": 0,
      "context": "출근길 인스타 피드 스크롤 중 무심코",
      "message_received": "페르소나가 인지한 메시지 (attention 낮으면 부분만)",
      "internal_reasoning": "1인칭 사고 — cognitive_mode 톤으로",
      "emotional_response": { "valence": 0.15, "arousal": 0.35 },
      "action_taken": "ignore"
    }
  ]
}
\`\`\`

규칙:
- exposure_narratives 는 위 사건들과 **정확히 같은 수, 같은 index 순서**
- life_entries 는 자유 작성 — 일반 라이프 로그 (식사·출근·여가)
- spend 는 실제 지출 시에만 (선택)`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}
