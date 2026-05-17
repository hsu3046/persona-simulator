// 마케팅·소비심리 grounding 점수 함수 — Plan §9 참조.
//
// 학문적 근거:
// - Krugman (1972) 3-hit + Ephron Recency + Burton et al (2024) — S-curve frequency lift
// - Cialdini (1984) Influence 6 principles — susceptibility multiplier
// - Petty-Cacioppo ELM / Chaiken HSM — involvement·route 영향
// - Byron Sharp Mental Availability — 카테고리별 brand recall depth
// - Kahneman-Tversky Loss Aversion — 가격·위험 회피
// - Cognitive Load model — 시간대별 attention 변동
//
// 책임: 노출 발생 여부·attention·funnel delta 를 deterministic 으로 결정.
// LLM 은 narrative-only (1인칭 일기·reasoning) 작가 역할만.

import type {
  CialdiniSusceptibility,
  FunnelStage,
  MediaChannel,
  Persona,
  Product,
} from "@/types";

// ─────────────────────────────────────────────────
// Defaults — 기존 페르소나(localStorage)에 새 필드 없을 때 사용
// ─────────────────────────────────────────────────

export const DEFAULT_CIALDINI: CialdiniSusceptibility = {
  social_proof: 0.55,
  authority: 0.45,
  scarcity: 0.4,
  reciprocity: 0.5,
  liking: 0.5,
  consistency: 0.5,
};

export function getCialdini(p: Persona): CialdiniSusceptibility {
  return { ...DEFAULT_CIALDINI, ...(p._sim.cialdini_susceptibility ?? {}) };
}

export function getInvolvement(p: Persona, category: string): number {
  const explicit = p._sim.involvement_by_category?.[category];
  if (typeof explicit === "number") return clamp(explicit, 0, 1);
  // 디지털 전문가·고소득·early adopter 류는 default 관여도 ↑
  const baseByLiteracy: Record<string, number> = {
    low: 0.25,
    medium: 0.4,
    high: 0.55,
    expert: 0.7,
  };
  return baseByLiteracy[p.basic.digital_literacy] ?? 0.4;
}

export function getMentalAvailability(p: Persona, category: string): number {
  const explicit = p._sim.mental_availability_by_category?.[category];
  if (typeof explicit === "number") return clamp(explicit, 0, 1);
  // category_preferences 에 해당 카테고리 있으면 인지하는 브랜드 풀이 있다는 의미
  const pref = p._sim.category_preferences[category];
  if (pref) return clamp(0.4 + pref.satisfaction * 0.3, 0, 1);
  return 0.25;
}

export function getCognitiveDefault(p: Persona): "system1" | "system2" {
  if (p._sim.cognitive_processing_default)
    return p._sim.cognitive_processing_default;
  // 전문가·고관여 직업은 system2 default
  if (p.basic.digital_literacy === "expert") return "system2";
  return "system1";
}

export function getLossAversion(p: Persona): number {
  return p._sim.loss_aversion ?? 0.4 + p._sim.price_sensitivity * 0.3;
}

export function getStatusQuoBias(p: Persona): number {
  return p._sim.status_quo_bias ?? p._sim.brand_loyalty * 0.7;
}

// ─────────────────────────────────────────────────
// Cognitive context — 시간대별 attention multiplier
// ─────────────────────────────────────────────────

/**
 * 시간대별 인지 부담·여유 — 노출 attention 에 곱연산.
 *
 * 출퇴근 시간 = busy/distracted → System 1 dominant, attention 감소
 * 점심·저녁 여가 = relaxed → System 2 가능, attention 증가
 */
export function cognitiveContextMultiplier(hour: number): number {
  if (hour >= 7 && hour < 9) return 0.6; // 출근 러시
  if (hour >= 9 && hour < 12) return 0.85; // 오전 업무
  if (hour >= 12 && hour < 14) return 1.1; // 점심
  if (hour >= 14 && hour < 18) return 0.85; // 오후 업무
  if (hour >= 18 && hour < 20) return 0.75; // 퇴근 러시
  if (hour >= 20 && hour < 23) return 1.2; // 저녁 여가
  return 0.7; // 심야·새벽
}

/**
 * 시간대가 페르소나의 cognitive default 를 override 하는지.
 * 출퇴근·심야는 페르소나의 system2 default 도 system1 로 강제.
 */
export function effectiveCognitiveMode(
  p: Persona,
  hour: number,
): "system1" | "system2" {
  const base = getCognitiveDefault(p);
  // 인지 부담 큰 시간대 = system1 강제
  if (hour >= 7 && hour < 9) return "system1";
  if (hour >= 18 && hour < 20) return "system1";
  if (hour >= 23 || hour < 6) return "system1";
  return base;
}

// ─────────────────────────────────────────────────
// 노출 확률 — channel × persona × product × time
// ─────────────────────────────────────────────────

export interface ExposureProbabilityArgs {
  channel: MediaChannel;
  persona: Persona;
  product: Product;
  /** 한 hour-block 인지 daily 인지 caller 가 결정 */
  windowMinutes?: number;
}

export function computeExposureProbability({
  channel,
  persona,
  product,
  windowMinutes = 60,
}: ExposureProbabilityArgs): number {
  const habit = persona._sim.media_channels.find((m) => m.channel === channel);
  if (!habit) return 0;
  const channelPlan = product.channels.find((c) => c.channel === channel);
  if (!channelPlan) return 0;

  // habit.daily_minutes 가 windowMinutes 중 차지하는 비율
  const exposureMinutesInWindow = (habit.daily_minutes / (24 * 60)) * windowMinutes;
  const timeAlignment = clamp(exposureMinutesInWindow / Math.max(1, windowMinutes * 0.05), 0, 1);

  const spendShare = channelPlan.spend_share;
  const targetingMatch = checkTargetingMatch(persona, channelPlan.targeting);

  // 베이스 확률
  const base = timeAlignment * spendShare * targetingMatch;

  // 채널 spend 가 크면 한 window 내 다중 노출 가능 — 증폭
  return clamp(base * 2.5, 0, 0.85);
}

function checkTargetingMatch(
  persona: Persona,
  targeting: Product["channels"][number]["targeting"],
): number {
  if (!targeting) return 1.0;
  let score = 1.0;
  const age = persona.basic.age_exact ?? guessAgeFromRange(persona.basic.age_range);
  if (targeting.age_range) {
    const [min, max] = targeting.age_range;
    if (age < min || age > max) {
      score *= 0.35; // 타겟 밖이지만 완전 0 은 아님 (spill-over)
    }
  }
  if (targeting.regions && targeting.regions.length > 0) {
    const personaRegion = persona._sim.region.city;
    if (!targeting.regions.some((r) => personaRegion.includes(r) || r.includes(personaRegion))) {
      score *= 0.5;
    }
  }
  return score;
}

function guessAgeFromRange(range: string): number {
  // "30대 초반" → 32, "40대 중반" → 45, etc.
  const decade = parseInt(range.match(/(\d+)대/)?.[1] ?? "30", 10);
  if (range.includes("초")) return decade + 2;
  if (range.includes("중")) return decade + 5;
  if (range.includes("후")) return decade + 8;
  return decade + 5;
}

// ─────────────────────────────────────────────────
// Attention level — receptivity × creative × context × fatigue
// ─────────────────────────────────────────────────

export interface AttentionArgs {
  receptivity: number; // habit.receptivity_to_ads
  creativeQuality?: number; // 0.3-1.0 (LLM 추정 or default 0.6)
  hour: number;
  priorExposureCount: number;
  /** 카테고리별 광고 fatigue rate (default 0.05) */
  fatigueRate?: number;
}

export function computeAttentionLevel({
  receptivity,
  creativeQuality = 0.6,
  hour,
  priorExposureCount,
  fatigueRate = 0.05,
}: AttentionArgs): number {
  const ctx = cognitiveContextMultiplier(hour);
  // 3회 이후부터 점진 fatigue
  const fatigue =
    1 - Math.min(0.8, fatigueRate * Math.max(0, priorExposureCount - 3));
  // novelty 는 5회 이후로 점점 평탄해짐
  const novelty = clamp(1 - priorExposureCount * 0.05, 0.3, 1.0);
  return clamp(receptivity * creativeQuality * ctx * fatigue * novelty, 0, 1);
}

// ─────────────────────────────────────────────────
// Frequency lift — Krugman/Burton/Ephron 합성 S-curve
// ─────────────────────────────────────────────────

/**
 * 누적 N 회차 노출에서 funnel 진전 기여도 (0-0.30).
 * x=1: ~0.05, x=3: ~0.20 (peak 가속), x=8+: ~0.30 plateau.
 *
 * 공식: y = (e^(0.5x) - 1) / (e^(0.5x) + 9), clamped 0-0.30
 */
export function frequencyLift(priorExposureCount: number): number {
  const x = priorExposureCount + 1; // 이번 노출 포함
  const raw = (Math.exp(0.5 * x) - 1) / (Math.exp(0.5 * x) + 9);
  return Math.min(0.3, Math.max(0, raw));
}

// ─────────────────────────────────────────────────
// Cialdini multiplier
// ─────────────────────────────────────────────────

export interface CreativeSignals {
  has_social_proof?: boolean; // "300만 가입", 후기, "인기"
  has_scarcity?: boolean; // "한정", "선착순", "오늘까지"
  has_authority?: boolean; // 전문가·기관·인증
  has_reciprocity?: boolean; // "무료 체험", "샘플"
  has_likable_character?: boolean; // 연예인·캐릭터
  has_consistency_hook?: boolean; // "이미 시작했으니" 패턴
}

export interface CialdiniMultArgs {
  persona: Persona;
  channel: MediaChannel;
  signals?: CreativeSignals;
}

/**
 * 광고 메시지의 Cialdini 시그널과 페르소나 susceptibility 매칭으로 funnel multiplier (1.0-2.5).
 * word_of_mouth 채널은 본질적으로 social proof × Korean collective culture (×1.5 강화).
 */
export function cialdiniMultiplier({
  persona,
  channel,
  signals = {},
}: CialdiniMultArgs): number {
  const s = getCialdini(persona);
  let m = 1.0;

  // 채널 본질
  if (channel === "word_of_mouth") m += s.social_proof * 1.2; // 한국 collective ×1.5
  if (channel === "kakao_talk") m += s.social_proof * 0.6; // 친한 사람 추천 채널
  if (channel === "blog_review") m += s.social_proof * 0.4 + s.authority * 0.2;

  // 크리에이티브 시그널
  if (signals.has_social_proof) m += s.social_proof * 0.4;
  if (signals.has_scarcity) m += s.scarcity * 0.35;
  if (signals.has_authority) m += s.authority * 0.3;
  if (signals.has_reciprocity) m += s.reciprocity * 0.35;
  if (signals.has_likable_character) m += s.liking * 0.25;
  if (signals.has_consistency_hook) m += s.consistency * 0.2;

  return clamp(m, 1.0, 2.8);
}

/** LLM 없이 creative_summary 텍스트에서 Cialdini 시그널 키워드 추출 */
export function detectCreativeSignals(creativeSummary: string): CreativeSignals {
  const t = creativeSummary.toLowerCase();
  return {
    has_social_proof:
      /\d+\s*(만|천|명|만명).*(가입|사용|선택|회원|이용)|후기|리뷰|인기|베스트/i.test(
        creativeSummary,
      ) || /testimonial|reviews|popular|trending/i.test(t),
    has_scarcity:
      /한정|선착순|마감|품절|오늘까지|이번\s*주|얼마\s*남지/i.test(creativeSummary) ||
      /limited|hurry|ends/i.test(t),
    has_authority:
      /전문가|박사|의사|약사|검증|인증|공식|1위|특허/i.test(creativeSummary) ||
      /award|certified|expert/i.test(t),
    has_reciprocity:
      /무료|free|체험|샘플|증정|쿠폰|선물/i.test(creativeSummary),
    has_likable_character:
      /연예인|아이돌|배우|모델|캐릭터|친근|귀여/i.test(creativeSummary),
    has_consistency_hook:
      /이미\s*시작|계속|꾸준|이어|연속/i.test(creativeSummary),
  };
}

// ─────────────────────────────────────────────────
// Funnel delta — 핵심 함수
// ─────────────────────────────────────────────────

export interface FunnelDeltaArgs {
  attention: number;
  priorExposureCount: number;
  /** 0-1, 광고 메시지가 페르소나의 resonating_messages 와 얼마나 일치하나 */
  messageMatchScore: number;
  cialdiniMult: number;
  involvement: number;
  lossAversion: number;
  /** product 가격이 페르소나 소득 대비 부담스러운 정도 (0-1) */
  priceConcern: number;
  mentalAvailability: number;
  statusQuoBias: number;
  /** 기존 만족하는 브랜드 있으면 1, 없으면 0 */
  hasIncumbentBrand: boolean;
  /** 현재 funnel 진행도 (0-1) — late stage 는 더 느리게 */
  currentStageProgress: number;
}

export function computeFunnelDelta({
  attention,
  priorExposureCount,
  messageMatchScore,
  cialdiniMult,
  involvement,
  lossAversion,
  priceConcern,
  mentalAvailability,
  statusQuoBias,
  hasIncumbentBrand,
  currentStageProgress,
}: FunnelDeltaArgs): number {
  const freqContribution = frequencyLift(priorExposureCount);

  let delta =
    freqContribution *
    attention *
    (0.4 + messageMatchScore * 0.6) *
    cialdiniMult *
    (1 + mentalAvailability * 0.4);

  // 관여도 — 높으면 신중해서 진전 느림 (central route)
  delta = delta / (1 + involvement * 0.6);

  // 손실 회피 — 가격 부담 큰 페르소나에 비싼 제품 = 감속
  delta = delta * (1 - lossAversion * priceConcern * 0.6);

  // Status quo bias — 기존 만족 브랜드 있으면 추가 감속
  if (hasIncumbentBrand) {
    delta = delta * (1 - statusQuoBias * 0.5);
  }

  // Late stages 는 더 느리게 (S-curve 후반)
  if (currentStageProgress > 0.7) delta *= 0.5;
  else if (currentStageProgress > 0.5) delta *= 0.75;

  return clamp(delta, 0, 0.35); // 단일 노출 최대 진전 0.35
}

// ─────────────────────────────────────────────────
// Stage progress mapping
// ─────────────────────────────────────────────────

export const STAGE_THRESHOLDS: Array<{
  stage: FunnelStage;
  min: number;
  max: number;
}> = [
  { stage: "unaware", min: 0, max: 0.08 },
  { stage: "aware", min: 0.08, max: 0.22 },
  { stage: "interested", min: 0.22, max: 0.4 },
  { stage: "considering", min: 0.4, max: 0.58 },
  { stage: "intent", min: 0.58, max: 0.78 },
  { stage: "trial", min: 0.78, max: 0.88 },
  { stage: "purchase", min: 0.88, max: 0.96 },
  { stage: "repeat", min: 0.96, max: 1.0 },
  // advocate / churned 는 post-purchase 별도 로직 (POC 미구현)
];

export function progressToStage(progress: number): FunnelStage {
  const p = clamp(progress, 0, 1);
  for (const t of STAGE_THRESHOLDS) {
    if (p >= t.min && p < t.max) return t.stage;
  }
  return "repeat";
}

export function stageToProgress(stage: FunnelStage): number {
  const t = STAGE_THRESHOLDS.find((x) => x.stage === stage);
  if (!t) return 0;
  return (t.min + t.max) / 2;
}

// ─────────────────────────────────────────────────
// 메시지 매칭 — resonating_messages overlap (LLM 없이 휴리스틱)
// ─────────────────────────────────────────────────

/**
 * 광고 카피와 페르소나의 resonating_messages 의 단어/주제 overlap.
 * 0=관련 없음, 1=완벽 매칭.
 *
 * 휴리스틱 baseline — 후에 LLM embedding 으로 교체 가능.
 */
export function computeMessageMatch(
  creativeSummary: string,
  resonatingMessages: string[],
): number {
  if (resonatingMessages.length === 0) return 0.3;
  const summaryTokens = tokenizeKo(creativeSummary);
  let bestScore = 0;
  for (const msg of resonatingMessages) {
    const msgTokens = tokenizeKo(msg);
    const overlap = msgTokens.filter((t) =>
      summaryTokens.some((s) => s.includes(t) || t.includes(s)),
    ).length;
    const score = overlap / Math.max(1, msgTokens.length);
    if (score > bestScore) bestScore = score;
  }
  return clamp(bestScore, 0, 1);
}

function tokenizeKo(text: string): string[] {
  // 1자 이상의 한글·영문 단어 토큰화. 조사/어미 단순 처리.
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

// ─────────────────────────────────────────────────
// 가격 부담 계산
// ─────────────────────────────────────────────────

/**
 * 제품 가격이 페르소나 소득 대비 얼마나 부담인지 (0-1).
 * 0: 가격 0 또는 압도적으로 저렴
 * 1: 월소득 100% 이상 (감당 어려움)
 */
export function computePriceConcern(persona: Persona, priceKrw: number): number {
  if (priceKrw <= 0) return 0;
  const monthly = persona._sim.income_monthly_krw;
  if (monthly <= 0) return 0.7; // 소득 없으면 일단 부담스럽다고
  const ratio = priceKrw / monthly;
  // 0~5% 가격이면 부담 거의 없음, 50%+ 면 매우 부담
  return clamp(Math.log10(1 + ratio * 20) / Math.log10(11), 0, 1);
}

// ─────────────────────────────────────────────────
// Forgetting Curve (Ebbinghaus) — 광고 기억 감퇴
// ─────────────────────────────────────────────────

/**
 * Ebbinghaus 망각 곡선 — 시간 t (일) 후 광고 기억 retention (0-1).
 * 광고는 명시 학습보다 약하므로 반감기 τ ≈ 2일 (소비자 조사 평균).
 *
 * retention(t) = e^(-t / τ)
 * - t=0일:  1.0 (방금 봄)
 * - t=1일:  0.61
 * - t=3일:  0.22
 * - t=7일:  0.03
 */
export function adRetention(daysSinceExposure: number, halfLifeDays = 2): number {
  if (daysSinceExposure < 0) return 1;
  return Math.exp(-daysSinceExposure / halfLifeDays);
}

/**
 * 시간 가중 누적 노출 (effective exposure count).
 * priorExposureTimes: 이전 노출들의 timestamps.
 * now: 현재 시점.
 *
 * 단순 회수 카운트가 아닌, 각 노출의 retention 합산 → "기억에 남은 노출 수".
 * 7d/30d 모드에서 핵심 — 1주 전 5회 노출 ≈ 어제 1회 (decay 적용).
 */
export function effectiveExposureCount(
  priorExposureIsoTimes: string[],
  nowIso: string,
  halfLifeDays = 2,
): number {
  const now = new Date(nowIso).getTime();
  let sum = 0;
  for (const ts of priorExposureIsoTimes) {
    const t = new Date(ts).getTime();
    const days = Math.max(0, (now - t) / (1000 * 60 * 60 * 24));
    sum += adRetention(days, halfLifeDays);
  }
  return sum;
}

// ─────────────────────────────────────────────────
// Sharp Mental Availability gate
// ─────────────────────────────────────────────────

/**
 * McKinsey CDJ 의 "initial consideration set" 진입 게이트.
 * Sharp 의 핵심 주장 — funnel 진전 전에 brand 가 페르소나의 마음 속 후보 풀에 들어가야 함.
 *
 * 진입 조건:
 *   - mental_availability >= GATE_BASE (기본 0.30) 이거나
 *   - 누적 effective_exposures >= EXPOSURES_REQUIRED (기본 3회) 로 MA 부족 보완
 *
 * 반환: gate 통과 여부 + 진단 메시지
 */
export interface MentalAvailabilityGateArgs {
  mentalAvailability: number;
  effectiveExposures: number;
  hasDistinctiveAssets: boolean;
}

const GATE_MA_BASE = 0.3;
const GATE_EXPOSURES_BASE = 3;

export function mentalAvailabilityGate(args: MentalAvailabilityGateArgs): {
  passes: boolean;
  reason: string;
} {
  const { mentalAvailability, effectiveExposures, hasDistinctiveAssets } = args;
  // DBA 가 있으면 진입 난이도 ↓ (Sharp DBA 효과)
  const maThreshold = hasDistinctiveAssets ? GATE_MA_BASE - 0.05 : GATE_MA_BASE;
  const expThreshold = hasDistinctiveAssets
    ? GATE_EXPOSURES_BASE - 1
    : GATE_EXPOSURES_BASE;
  if (mentalAvailability >= maThreshold) {
    return { passes: true, reason: "mental_availability_high" };
  }
  if (effectiveExposures >= expThreshold) {
    return { passes: true, reason: "exposure_threshold_met" };
  }
  return {
    passes: false,
    reason: "mental_availability_low_and_insufficient_exposures",
  };
}

/**
 * 노출 1회당 Sharp DBA 가 누적 시키는 mental_availability 증가량.
 * Distinctive asset 수에 비례 (0-5 → 0.02-0.10).
 */
export function dbaContributionPerExposure(assetCount: number): number {
  return Math.min(0.1, 0.02 + assetCount * 0.015);
}

// ─────────────────────────────────────────────────
// McKinsey CDJ 5-stage mapping (Plan §9 medium step)
// ─────────────────────────────────────────────────

export type CdjPhase =
  | "out_of_market" // 인지 자체 안 됨 — Sharp 게이트 미통과
  | "initial_consideration" // 마음 속 후보 풀에 진입
  | "active_evaluation" // 적극 비교·검색·후기
  | "moment_of_purchase" // 구매 결정 시점
  | "post_purchase" // 사용 경험
  | "loyalty_loop"; // 재구매 (재고려 회피)

/**
 * 10단계 internal funnel → 5단계 McKinsey CDJ.
 * UI 에 마케터에게 노출할 때 CDJ 어휘 사용.
 */
export function toCdjPhase(stage: FunnelStage): CdjPhase {
  switch (stage) {
    case "unaware":
      return "out_of_market";
    case "aware":
    case "interested":
      return "initial_consideration";
    case "considering":
      return "active_evaluation";
    case "intent":
    case "trial":
      return "moment_of_purchase";
    case "purchase":
      return "post_purchase";
    case "repeat":
    case "advocate":
      return "loyalty_loop";
    case "churned":
      return "out_of_market";
  }
}

export const CDJ_LABEL: Record<CdjPhase, string> = {
  out_of_market: "관심 밖",
  initial_consideration: "후보 진입",
  active_evaluation: "비교·검색",
  moment_of_purchase: "구매 결정",
  post_purchase: "사용 경험",
  loyalty_loop: "재구매 루프",
};

// ─────────────────────────────────────────────────
// Multi-Touch Attribution
// ─────────────────────────────────────────────────

export type AttributionModel =
  | "last_touch"
  | "first_touch"
  | "linear"
  | "time_decay";

export interface AttributionEvent {
  channel: MediaChannel;
  timestampIso: string;
}

/**
 * Funnel 전환 시점의 touchpoint sequence → 채널별 기여 credit (합 = 1).
 *
 * - last_touch: 마지막 노출 채널 100%
 * - first_touch: 첫 노출 채널 100%
 * - linear: N 등분 (균등)
 * - time_decay: 전환 직전일수록 가중. 반감기 2일.
 */
export function computeAttribution(
  events: AttributionEvent[],
  conversionIso: string,
  model: AttributionModel,
): Record<MediaChannel, number> {
  const credits: Partial<Record<MediaChannel, number>> = {};
  if (events.length === 0) return credits as Record<MediaChannel, number>;

  if (model === "last_touch") {
    const last = events[events.length - 1]!;
    credits[last.channel] = (credits[last.channel] ?? 0) + 1;
  } else if (model === "first_touch") {
    const first = events[0]!;
    credits[first.channel] = (credits[first.channel] ?? 0) + 1;
  } else if (model === "linear") {
    const share = 1 / events.length;
    for (const e of events) {
      credits[e.channel] = (credits[e.channel] ?? 0) + share;
    }
  } else if (model === "time_decay") {
    const convT = new Date(conversionIso).getTime();
    const weights = events.map((e) => {
      const days = Math.max(0, (convT - new Date(e.timestampIso).getTime()) / (86400 * 1000));
      return adRetention(days, 2);
    });
    const totalW = weights.reduce((s, w) => s + w, 0);
    if (totalW > 0) {
      for (let i = 0; i < events.length; i++) {
        const e = events[i]!;
        const w = weights[i]! / totalW;
        credits[e.channel] = (credits[e.channel] ?? 0) + w;
      }
    }
  }
  return credits as Record<MediaChannel, number>;
}

// ─────────────────────────────────────────────────
// utils
// ─────────────────────────────────────────────────

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
